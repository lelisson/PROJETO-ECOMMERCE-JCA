from __future__ import annotations

from flask import (
    Blueprint,
    abort,
    flash,
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
from jca_ecommerce.models import Order, OrderItem, Product, db

bp = Blueprint("store", __name__)

SHIPPING_FREE_MIN_CENTS = 20000
SHIPPING_FLAT_CENTS = 1590


def _cart() -> dict[str, int]:
    return session.setdefault("cart", {})


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

    return {
        "empresa_razao": current_app.config.get("EMPRESA_RAZAO", ""),
        "empresa_cnpj": current_app.config.get("EMPRESA_CNPJ", ""),
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


@bp.post("/carrinho/adicionar/<int:product_id>")
def add_to_cart(product_id):
    p = Product.query.filter_by(id=product_id, active=True).first()
    if not p:
        abort(404)
    cart = _cart()
    key = str(product_id)
    cart[key] = int(cart.get(key, 0)) + int(request.form.get("qty", 1))
    if cart[key] < 1:
        cart[key] = 1
    session.modified = True
    flash("Item adicionado ao carrinho.", "ok")
    return redirect(request.referrer or url_for("store.products"))


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


@bp.route("/checkout", methods=["GET", "POST"])
def checkout():
    lines, subtotal = _cart_lines()
    if not lines:
        flash("Seu carrinho está vazio.", "erro")
        return redirect(url_for("store.cart"))
    shipping = 0 if subtotal >= SHIPPING_FREE_MIN_CENTS else SHIPPING_FLAT_CENTS
    total = subtotal + shipping

    if request.method == "POST":
        tipo_s = request.form.get("customer_type", "pf")
        tipo = TipoCliente.JURIDICA if tipo_s == "pj" else TipoCliente.FISICA
        doc = request.form.get("document", "")
        name = (request.form.get("name") or "").strip()
        email = (request.form.get("email") or "").strip()
        phone = (request.form.get("phone") or "").strip()

        ok, msg_or_digits = validar_documento(tipo, doc)
        if not ok:
            flash(msg_or_digits, "erro")
            return render_template(
                "checkout.html",
                lines=lines,
                subtotal_cents=subtotal,
                shipping_cents=shipping,
                total_cents=total,
                form=request.form,
                fiscal_label=label_documento_fiscal(tipo_fiscal_para_cliente(tipo)),
            )
        if not name or not email:
            flash("Nome e e-mail são obrigatórios.", "erro")
            return render_template(
                "checkout.html",
                lines=lines,
                subtotal_cents=subtotal,
                shipping_cents=shipping,
                total_cents=total,
                form=request.form,
                fiscal_label=label_documento_fiscal(tipo_fiscal_para_cliente(tipo)),
            )

        ft = tipo_fiscal_para_cliente(tipo)
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
            fiscal_status="pendente",
        )
        db.session.add(order)
        db.session.flush()
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
        )

    tipo_default = TipoCliente.FISICA
    return render_template(
        "checkout.html",
        lines=lines,
        subtotal_cents=subtotal,
        shipping_cents=shipping,
        total_cents=total,
        form={},
        fiscal_label=label_documento_fiscal(tipo_fiscal_para_cliente(tipo_default)),
    )
