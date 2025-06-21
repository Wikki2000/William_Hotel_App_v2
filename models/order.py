#!/usr/bin/python3
"""order Module"""
from datetime import datetime
from models.base_model import Base, BaseModel
from models.order_item import OrderItem
from models.receipt import Receipt
from sqlalchemy import (
    Column, String, Boolean, ForeignKey, Float, ForeignKey, Integer
)
from sqlalchemy.orm import relationship


class Order(BaseModel, Base):
    """Define class for storing customer orders"""
    __tablename__ = "orders"
    payment_type = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    is_paid = Column(Boolean, default=False)
    terminal = Column(String(10), nullable=False)
    customer_id = Column(
        String(60), ForeignKey("customers.id"), nullable=False
    )

    # Staff involve in making order and clearing bill
    ordered_by_id = Column(
        String(60), ForeignKey("users.id"), nullable=False
    )
    cleared_by_id = Column(String(60), ForeignKey("users.id"))

    # Relationships
    order_items = relationship('OrderItem', backref='order',
                               cascade='all, delete-orphan')
    receipt = relationship('Receipt', backref='order', uselist=False,
                            cascade='all, delete-orphan')
