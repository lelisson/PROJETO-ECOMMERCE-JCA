import os
import sys

# Garante imports (config) mesmo se o processo foi iniciado com pasta de trabalho errada (ex.: host\).
_PKG = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.abspath(os.path.join(_PKG, ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from flask import Flask

from config import Config
from jca_ecommerce.models import db
from jca_ecommerce.seed import seed_products_if_empty
from jca_ecommerce import views


def create_app(config_class: type = Config) -> Flask:
    tmpl = os.path.join(_ROOT, "templates")
    static = os.path.join(_ROOT, "static")
    app = Flask(
        __name__,
        template_folder=tmpl,
        static_folder=static,
        static_url_path="/static",
    )
    app.config.from_object(config_class)

    inst = os.path.join(_ROOT, "instance")
    os.makedirs(inst, exist_ok=True)

    db.init_app(app)
    app.register_blueprint(views.bp)

    with app.app_context():
        db.create_all()
        seed_products_if_empty()

    return app
