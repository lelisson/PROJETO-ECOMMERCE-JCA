"""Servidor de desenvolvimento — use também a pasta `host/` para subir localmente."""

from jca_ecommerce import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
