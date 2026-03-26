from __future__ import annotations

import secrets

from flask import (
    Blueprint,
    abort,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from sqlalchemy import or_

from jca_ecommerce.br_fiscal import (
    TipoCliente,
    formatar_documento_exibicao,
    label_documento_fiscal,
    tipo_fiscal_para_cliente,
    validar_documento,
)
from jca_ecommerce.freight import calculate_freight_for_cep
from jca_ecommerce.models import Order, OrderItem, Product, db

bp = Blueprint("store", __name__)

PAYMENT_LABELS = {
    "pix": "PIX",
    "debito": "Cartão de débito",
    "credito": "Cartão de crédito",
    "boleto": "Boleto bancário",
}

SHIPPING_FREE_MIN_CENTS = 20000
SHIPPING_FLAT_CENTS = 1590


@bp.route("/health")
def health():
    """Teste rápido sem template — se abrir no navegador, o servidor está ok."""
    return "JCA Store OK. Abra a pagina inicial (rota /).", 200, {"Content-Type": "text/plain; charset=utf-8"}


def _cart() -> dict[str, int]:
    return session.setdefault("cart", {})


def _cart_count() -> int:
    cart = session.get("cart") or {}
    n = 0
    for v in cart.values():
        try:
            n += int(v)
        except (TypeError, ValueError):
            pass
    return n


def _cart_lines():
    cart = _cart()
    lines = []
    subtotal = 0
    for pid_s, qty in list(cart.items()):
        try:
            pid = int(pid_s)
            q = int(qty)
        except (TypeError, ValueError):
            continue
        if q < 1:
            continue
        p = Product.query.get(pid)
        if not p or not p.active:
            continue
        line_total = p.price_cents * q
        subtotal += line_total
        lines.append({"product": p, "quantity": q, "line_cents": line_total})
    return lines, subtotal


@bp.app_context_processor
def inject_company():
    from flask import current_app

    nav_categories: list[str] = []
    try:
        nav_categories = [
            row[0]
            for row in db.session.query(Product.category)
            .filter(Product.active.is_(True))
            .distinct()
            .order_by(Product.category)
            .all()
            if row[0]
        ]
    except Exception:
        pass

    return {
        "empresa_razao": current_app.config.get("EMPRESA_RAZAO", ""),
        "empresa_cnpj": current_app.config.get("EMPRESA_CNPJ", ""),
        "cart_count": _cart_count(),
        "nav_categories": nav_categories,
        "shipping_flat_cents": SHIPPING_FLAT_CENTS,
        "shipping_free_min_cents": SHIPPING_FREE_MIN_CENTS,
    }


@bp.route("/")
def home():
    featured = Product.query.filter_by(active=True).order_by(Product.id).limit(6).all()
    return render_template("home.html", featured=featured)


@bp.route("/produtos")
def products():
    q = (request.args.get("q") or "").strip()
    cat = (request.args.get("categoria") or "").strip()
    query = Product.query.filter_by(active=True)
    if cat:
        query = query.filter(Product.category == cat)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Product.name.ilike(like), Product.short_desc.ilike(like)))
    items = query.order_by(Product.name).all()
    categories = (
        db.session.query(Product.category).filter(Product.active.is_(True)).distinct().order_by(Product.category).all()
    )
    categories = [c[0] for c in categories if c[0]]
    return render_template("products.html", items=items, q=q, cat=cat, categories=categories)


@bp.route("/produto/<slug>")
def product_detail(slug):
    p = Product.query.filter_by(slug=slug, active=True).first()
    if not p:
        abort(404)
    return render_template("product.html", product=p)


@bp.route("/atendimento")
def atendimento():
    return render_template("atendimento.html")


@bp.route("/sobre")
def sobre():
    return render_template("sobre.html")


def _wants_json_response() -> bool:
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return True
    best = request.accept_mimetypes.best_match(["application/json", "text/html"])
    return best == "application/json"


@bp.post("/carrinho/adicionar/<int:product_id>")
def add_to_cart(product_id):
    try:
        if request.is_json:
            payload = request.get_json(silent=True) or {}
            qty = int(payload.get("qty", 1))
        else:
            qty = int(request.form.get("qty", 1))
    except (TypeError, ValueError):
        qty = 1
    if qty < 1:
        qty = 1

    p = Product.query.filter_by(id=product_id, active=True).first()
    if not p:
        if _wants_json_response():
            return jsonify(ok=False, error="Produto não encontrado."), 404
        abort(404)

    cart = _cart()
    key = str(product_id)
    cart[key] = int(cart.get(key, 0)) + qty
    if cart[key] < 1:
        cart[key] = 1
    session.modified = True

    if _wants_json_response():
        return jsonify(
            ok=True,
            cart_count=_cart_count(),
            message="Item adicionado ao carrinho.",
        )

    flash("Item adicionado ao carrinho.", "ok")
    return redirect(request.referrer or url_for("store.products"))


@bp.get("/api/carrinho/contagem")
def api_cart_count():
    """Para sincronizar o número do carrinho no cabeçalho após navegação."""
    return jsonify(cart_count=_cart_count())


@bp.post("/api/frete/calcular")
def api_freight_calc():
    """Calcula frete por distância (OSRM / fallback) — demonstração."""
    payload = request.get_json(silent=True) or {}
    cep = payload.get("cep", "")
    out = calculate_freight_for_cep(cep)
    status = 200 if out.get("ok") else 400
    return jsonify(out), status


@bp.post("/carrinho/atualizar")
def update_cart():
    cart = _cart()
    for key in list(cart.keys()):
        field = f"qty_{key}"
        if field in request.form:
            try:
                q = int(request.form[field])
            except ValueError:
                q = 0
            if q < 1:
                del cart[key]
            else:
                cart[key] = q
    session.modified = True
    flash("Carrinho atualizado.", "ok")
    return redirect(url_for("store.cart"))


@bp.route("/carrinho")
def cart():
    lines, subtotal = _cart_lines()
    shipping = 0 if subtotal >= SHIPPING_FREE_MIN_CENTS else SHIPPING_FLAT_CENTS
    total = subtotal + shipping
    return render_template(
        "cart.html",
        lines=lines,
        subtotal_cents=subtotal,
        shipping_cents=shipping,
        total_cents=total,
        free_ship_remaining=max(0, SHIPPING_FREE_MIN_CENTS - subtotal),
    )


def _checkout_render(
    lines,
    subtotal,
    shipping,
    total,
    form,
    tipo_for_label,
):
    return render_template(
        "checkout.html",
        lines=lines,
        subtotal_cents=subtotal,
        shipping_cents=shipping,
        total_cents=total,
        form=form,
        fiscal_label=label_documento_fiscal(tipo_fiscal_para_cliente(tipo_for_label)),
        payment_labels=PAYMENT_LABELS,
    )


@bp.route("/checkout", methods=["GET", "POST"])
def checkout():
    lines, subtotal = _cart_lines()
    if not lines:
        flash("Seu carrinho está vazio.", "erro")
        return redirect(url_for("store.cart"))

    # Resumo inicial (frete ajustado no checkout conforme retirada / cálculo)
    shipping_preview = 0
    total_preview = subtotal + shipping_preview

    if request.method == "POST":
        tipo_s = request.form.get("customer_type", "pf")
        tipo = TipoCliente.JURIDICA if tipo_s == "pj" else TipoCliente.FISICA
        doc = request.form.get("document", "")
        name = (request.form.get("name") or "").strip()
        email = (request.form.get("email") or "").strip()
        phone = (request.form.get("phone") or "").strip()
        cep_raw = (request.form.get("cep") or "").strip()
        cep_digits = "".join(c for c in cep_raw if c.isdigit())
        delivery_mode = (request.form.get("delivery_mode") or "retirada").strip().lower()
        if delivery_mode not in ("retirada", "entrega"):
            delivery_mode = "retirada"
        pay_method = (request.form.get("payment_method") or "pix").strip().lower()
        if pay_method not in PAYMENT_LABELS:
            pay_method = "pix"

        ok, msg_or_digits = validar_documento(tipo, doc)
        if not ok:
            flash(msg_or_digits, "erro")
            return _checkout_render(lines, subtotal, shipping_preview, total_preview, request.form, tipo)

        if not name or not email:
            flash("Nome e e-mail são obrigatórios.", "erro")
            return _checkout_render(lines, subtotal, shipping_preview, total_preview, request.form, tipo)

        if len(cep_digits) != 8:
            flash("Informe um CEP válido (8 dígitos).", "erro")
            return _checkout_render(lines, subtotal, shipping_preview, total_preview, request.form, tipo)

        freight_km_val = None
        if delivery_mode == "entrega":
            fr = calculate_freight_for_cep(cep_digits)
            if not fr.get("ok"):
                flash(fr.get("error", "Não foi possível calcular o frete."), "erro")
                return _checkout_render(lines, subtotal, shipping_preview, total_preview, request.form, tipo)
            shipping = int(fr["freight_cents"])
            freight_km_val = float(fr["distance_km"])
        else:
            shipping = 0

        total = subtotal + shipping
        ft = tipo_fiscal_para_cliente(tipo)
        pickup_code = f"RET-{secrets.token_hex(4).upper()}"

        order = Order(
            customer_type=tipo.value,
            document_digits=msg_or_digits,
            name=name,
            email=email,
            phone=phone,
            fiscal_type=ft.value,
            subtotal_cents=subtotal,
            shipping_cents=shipping,
            total_cents=total,
            fiscal_status="simulacao",
            cep=cep_digits,
            delivery_mode=delivery_mode,
            freight_km=freight_km_val,
            payment_method=pay_method,
            pickup_code=pickup_code,
            tracking_code="",
        )
        db.session.add(order)
        db.session.flush()
        order.tracking_code = f"ETQ-BR-JCA-{order.id:06d}-{secrets.token_hex(3).upper()}"
        for line in lines:
            db.session.add(
                OrderItem(
                    order_id=order.id,
                    product_id=line["product"].id,
                    quantity=line["quantity"],
                    unit_price_cents=line["product"].price_cents,
                )
            )
        db.session.commit()
        session["cart"] = {}
        session.modified = True

        doc_fmt = formatar_documento_exibicao(tipo, msg_or_digits)
        return render_template(
            "order_done.html",
            order=order,
            lines=lines,
            document_formatted=doc_fmt,
            fiscal_label=label_documento_fiscal(ft),
            payment_label=PAYMENT_LABELS.get(pay_method, pay_method),
        )

    tipo_default = TipoCliente.FISICA
    return render_template(
        "checkout.html",
        lines=lines,
        subtotal_cents=subtotal,
        shipping_cents=shipping_preview,
        total_cents=total_preview,
        form={},
        fiscal_label=label_documento_fiscal(tipo_fiscal_para_cliente(tipo_default)),
        payment_labels=PAYMENT_LABELS,
    )
