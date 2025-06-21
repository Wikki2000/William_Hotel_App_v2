#!/usr/bin/python3
"""Food Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, ForeignKey, LargeBinary
)
from sqlalchemy.orm import relationship
from models.order_item import OrderItem

class Food(BaseModel, Base):
    """Define class for storing drinks"""
    __tablename__ = "foods"
    image = Column(LargeBinary)
    image_path = Column(String(225))
    name =  Column(String(60), nullable=False)
    qty_stock = Column(Integer, nullable=False)
    is_available = Column(Boolean, default=True)
    amount = Column(Float, nullable=False)
    terminal = Column(String(10), nullable=False)

    amount_open_bar = Column(Float)
    amount_game_house = Column(Float)
    amount_club_house = Column(Float)
    amount_private_lounge = Column(Float)

    order_items = relationship('OrderItem', backref='food',
                         cascade='all, delete-orphan')
