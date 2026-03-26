from jca_ecommerce.models import Product, db

# Imagens espelhadas de jcaplasticos.com.br (nomenclatura alinhada ao slug do produto no e-commerce).
SLUG_TO_LOCAL_IMAGE: dict[str, str] = {
    "fita-de-arquear-pet": "/static/img/produtos/fita-de-arquear-pet.jpg",
    "fita-adesiva": "/static/img/produtos/fita-adesiva.jpg",
    "filme-contratil": "/static/img/produtos/filme-contratil.jpg",
    "filme-stretch": "/static/img/produtos/filme-stretch.jpg",
    "filme-embala-tudo": "/static/img/produtos/filme-embala-tudo.jpg",
}


def sync_product_images_from_jca() -> None:
    """Atualiza image_url dos produtos existentes para as fotos locais (após migração de dados)."""
    changed = False
    for slug, path in SLUG_TO_LOCAL_IMAGE.items():
        p = Product.query.filter_by(slug=slug).first()
        if p and p.image_url != path:
            p.image_url = path
            changed = True
    if changed:
        db.session.commit()


def seed_products_if_empty() -> None:
    if Product.query.first():
        sync_product_images_from_jca()
        return
    catalog = [
        {
            "sku": "JCA-FITA-ARQ",
            "name": "Fita de Arquear (PET)",
            "slug": "fita-de-arquear-pet",
            "category": "Fita de Arquear",
            "short_desc": "Produzida com matéria prima virgem ou reciclada; alta resistência à tração.",
            "long_desc": "Fita PET para arqueação, ideal para embalagens e logística. Consulte larguras e espessuras.",
            "price_cents": 8990,
            "image_url": SLUG_TO_LOCAL_IMAGE["fita-de-arquear-pet"],
        },
        {
            "sku": "JCA-FITA-AD",
            "name": "Fita Adesiva",
            "slug": "fita-adesiva",
            "category": "Fita Adesiva",
            "short_desc": "Ideal para uso manual ou em máquinas automáticas.",
            "long_desc": "Fita adesiva de qualidade para fechamento de caixas e embalagens.",
            "price_cents": 2490,
            "image_url": SLUG_TO_LOCAL_IMAGE["fita-adesiva"],
        },
        {
            "sku": "JCA-FILME-CONT",
            "name": "Filme Contrátil",
            "slug": "filme-contratil",
            "category": "Filme Contrátil",
            "short_desc": "Também conhecido como filme termoencolhível / shrink.",
            "long_desc": "Filme para termoencolhimento, proteção e acabamento de produtos.",
            "price_cents": 15900,
            "image_url": SLUG_TO_LOCAL_IMAGE["filme-contratil"],
        },
        {
            "sku": "JCA-STRETCH",
            "name": "Filme Stretch",
            "slug": "filme-stretch",
            "category": "Filme Stretch",
            "short_desc": "Filme estirável para uso doméstico ou escala industrial.",
            "long_desc": "Paleteização e embalagem com excelente alongamento e fixação.",
            "price_cents": 11200,
            "image_url": SLUG_TO_LOCAL_IMAGE["filme-stretch"],
        },
        {
            "sku": "JCA-EMBALA",
            "name": "Filme Embala Tudo",
            "slug": "filme-embala-tudo",
            "category": "Filme Embala Tudo",
            "short_desc": "Filme de polietileno versátil para diversos segmentos.",
            "long_desc": "Indicado para clínicas, consultórios, salões, movelarias e muito mais.",
            "price_cents": 6790,
            "image_url": SLUG_TO_LOCAL_IMAGE["filme-embala-tudo"],
        },
    ]
    for p in catalog:
        db.session.add(Product(**p))
    db.session.commit()
