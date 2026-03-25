from __future__ import annotations

from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(32), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    short_desc = db.Column(db.Text, nullable=False)
    long_desc = db.Column(db.Text, default="")
    price_cents = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(500), default="")
    category = db.Column(db.String(80), default="")
    active = db.Column(db.Boolean, default=True, nullable=False)

    def price_brl(self) -> str:
        v = self.price_cents / 100
        return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    customer_type = db.Column(db.String(2), nullable=False)  # pf | pj
    document_digits = db.Column(db.String(14), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(40), default="")
    fiscal_type = db.Column(db.String(10), nullable=False)  # nfce | nfe
    fiscal_status = db.Column(db.String(20), default="pendente")  # pendente | autorizada (mock)
    subtotal_cents = db.Column(db.Integer, nullable=False)
    shipping_cents = db.Column(db.Integer, default=0)
    total_cents = db.Column(db.Integer, nullable=False)

    items = db.relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price_cents = db.Column(db.Integer, nullable=False)

    product = db.relationship("Product")
