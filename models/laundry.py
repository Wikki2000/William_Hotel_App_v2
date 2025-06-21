#!/usr/bin/python3
"""Game Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import Column, String, Float, LargeBinary
from sqlalchemy.orm import relationship
from models.order_item import OrderItem

class Laundry(BaseModel, Base):
    """Define class for storing laundries"""
    __tablename__ = "laundries"
    #image = Column(LargeBinary)
    image = Column(String(60))
    name =  Column(String(60), nullable=False)
    #is_available = Column(Boolean, default=True)
    amount = Column(Float, nullable=False)

    order_items = relationship('OrderItem', backref='laundry',
                                cascade='all, delete-orphan')
