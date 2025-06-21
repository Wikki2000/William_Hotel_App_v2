#!/usr/bin/python3
"""Game Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import Column, String, Float, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from models.order_item import OrderItem

class Game(BaseModel, Base):
    """Define class for storing games"""
    __tablename__ = "games"
    image = Column(LargeBinary)
    name =  Column(String(60), nullable=False)
    amount = Column(Float, nullable=False)
    terminal = Column(String(10), nullable=False)

    order_items = relationship('OrderItem', backref='game',
                                cascade='all, delete-orphan')
