#!/usr/bin/python3
"""receipt Module"""
from datetime import datetime
from models.base_model import Base, BaseModel
from sqlalchemy import Column, Integer, String, ForeignKey

class   Receipt(BaseModel, Base):
    """Store receipt of sales."""
    __tablename__ = "receipts"
    receipt_no = Column(String(60), nullable=False, unique=True)
    order_id = Column(String(60), ForeignKey("orders.id"))
    booking_id = Column(String(60), ForeignKey("bookings.id"))
