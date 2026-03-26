"""
Gera pasta copia-site/ com HTML estático para abrir no navegador sem Flask.
Execute na RAIZ do repositório: python host/exportar_copia_site.py
"""

from __future__ import annotations

import os
import re
import shutil
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

os.chdir(ROOT)


def main() -> None:
    from jca_ecommerce import create_app
    from jca_ecommerce.models import Product

    app = create_app()
    out = os.path.join(ROOT, "copia-site")
    os.makedirs(out, exist_ok=True)
    static_src = os.path.join(ROOT, "static")
    static_dst = os.path.join(out, "static")
    if os.path.isdir(static_dst):
        shutil.rmtree(static_dst)
    shutil.copytree(static_src, static_dst)

    client = app.test_client()

    with app.app_context():
        product_slugs = [p.slug for p in Product.query.all()]

    def fix(html: str) -> str:
        html = html.replace('href="/static/', 'href="static/')
        html = html.replace('src="/static/', 'src="static/')
        html = html.replace('action="/static/', 'action="static/')
        html = re.sub(r'href="/"', 'href="index.html"', html)
        html = re.sub(r'action="/"', 'action="index.html"', html)
        html = re.sub(r'href="/produtos"', 'href="produtos.html"', html)
        html = re.sub(r'action="/produtos"', 'action="produtos.html"', html)
        html = re.sub(r'href="/carrinho"', 'href="carrinho.html"', html)
        html = re.sub(r'action="/carrinho"', 'action="carrinho.html"', html)
        html = re.sub(r'href="/checkout"', 'href="checkout.html"', html)
        html = re.sub(r'action="/checkout"', 'action="checkout.html"', html)
        for slug in product_slugs:
            html = re.sub(
                rf'href="/produto/{re.escape(slug)}"',
                f'href="produto-{slug}.html"',
                html,
            )
        return html

    pages = [
        ("/", "index.html"),
        ("/produtos", "produtos.html"),
        ("/carrinho", "carrinho.html"),
    ]
    for path, fname in pages:
        r = client.get(path)
        status = r.status_code
        if status != 200:
            print(f"AVISO {path} -> {status}")
            continue
        body = fix(r.get_data(as_text=True))
        with open(os.path.join(out, fname), "w", encoding="utf-8") as f:
            f.write(body)
        print(f"OK {path} -> {fname}")

    with app.app_context():
        first_id = Product.query.filter_by(active=True).order_by(Product.id).first()
    if first_id:
        with client.session_transaction() as sess:
            sess["cart"] = {str(first_id.id): 1}
    r = client.get("/checkout")
    if r.status_code == 200:
        with open(os.path.join(out, "checkout.html"), "w", encoding="utf-8") as f:
            f.write(fix(r.get_data(as_text=True)))
        print("OK /checkout -> checkout.html")
    else:
        print(f"AVISO /checkout -> {r.status_code} (carrinho vazio ou erro)")

    with app.app_context():
        for p in Product.query.filter_by(active=True).all():
            path = f"/produto/{p.slug}"
            r = client.get(path)
            if r.status_code != 200:
                print(f"AVISO {path} -> {r.status_code}")
                continue
            fn = f"produto-{p.slug}.html"
            with open(os.path.join(out, fn), "w", encoding="utf-8") as f:
                f.write(fix(r.get_data(as_text=True)))
            print(f"OK {path} -> {fn}")

    readme = os.path.join(out, "COMO-ABRIR.txt")
    with open(readme, "w", encoding="utf-8") as f:
        f.write(
            "Cópia estática do JCA Store\n"
            "===========================\n\n"
            "Opção A — abrir direto:\n"
            "  Dê dois cliques em index.html (Chrome/Edge).\n"
            "  Se o CSS não carregar, use a opção B.\n\n"
            "Opção B — mini-servidor (recomendado):\n"
            "  Abra o PowerShell nesta pasta (copia-site) e rode:\n"
            "    py -m http.server 8765\n"
            "  Depois abra no navegador: http://127.0.0.1:8765/\n\n"
            "Para o site dinâmico (carrinho/checkout funcionando), na raiz do projeto:\n"
            "  py run.py\n"
            "  http://127.0.0.1:8080/\n"
        )
    print(f"Pronto: {out}")


if __name__ == "__main__":
    main()
