import os

from flask import Flask

from config import Config
from jca_ecommerce.models import db
from jca_ecommerce.seed import seed_products_if_empty
from jca_ecommerce import views


def create_app(config_class: type = Config) -> Flask:
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static",
        static_url_path="/static",
    )
    app.config.from_object(config_class)

    inst = os.path.abspath(os.path.join(app.root_path, "..", "instance"))
    os.makedirs(inst, exist_ok=True)

    db.init_app(app)
    app.register_blueprint(views.bp)

    with app.app_context():
        db.create_all()
        seed_products_if_empty()

    return app
