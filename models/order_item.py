#!/usr/bin/python3
"""order_item Module"""
from datetime import datetime
from models.base_model import Base, BaseModel
from sqlalchemy import (
    Column, String, Boolean, ForeignKey, Float, ForeignKey, Integer
)
from sqlalchemy.orm import relationship


class OrderItem(BaseModel, Base):
    """Define class for storing item ordered"""
    __tablename__ = "order_items"
    qty_order = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    food_id = Column(String(60), ForeignKey("foods.id"))
    drink_id = Column(String(60), ForeignKey("drinks.id"))
    game_id = Column(String(60), ForeignKey("games.id"))
    laundry_id = Column(String(60), ForeignKey("laundries.id"))
    order_id = Column(String(60), ForeignKey("orders.id"), nullable=False)
    terminal = Column(String(10), nullable=False)
