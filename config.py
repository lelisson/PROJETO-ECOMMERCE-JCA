import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-jca-store-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(os.path.abspath(os.path.dirname(__file__)), "instance", "jca_store.db"),
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Filial de venda / e-commerce (informado pelo cliente)
    EMPRESA_RAZAO = "JCA INDUSTRIA DE MATERIAL PLASTICO LTDA"
    EMPRESA_CNPJ = "26.295.687/0002-04"
