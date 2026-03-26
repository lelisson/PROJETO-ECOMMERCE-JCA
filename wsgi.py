"""WSGI entrypoint para produção (Render, gunicorn, etc.)."""

from jca_ecommerce import create_app

app = create_app()
