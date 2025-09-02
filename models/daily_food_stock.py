#!/usr/bin/python3
"""Daily Food Stock Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, ForeignKey, Index, Date
)
from sqlalchemy.orm import relationship
from datetime import date


class DailyFoodStock(BaseModel, Base):
    __tablename__ = 'daily_food_stock'

    food_id = Column(
        String(60),
        ForeignKey('foods.id', ondelete="CASCADE"),
        nullable=False
    )
    date = Column(Date, default=lambda: date.today(), nullable=False)
    opening = Column(Integer, nullable=False)
    additional = Column(Integer, default=0, nullable=False)
    spoilage = Column(Integer, default=0, nullable=False)
