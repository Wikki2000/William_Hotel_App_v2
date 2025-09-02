#!/usr/bin/python3
"""Setting Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import (
    Column, String, Integer, ForeignKey, Float, Index
)


class HotelSetting(BaseModel, Base):
    """Define class for storing hotel settings."""
    __tablename__ = "hotel_settings"

    early_checkin_amount = Column(Float, default=5000)
    short_time_amount = Column(Float, default=5000)
    late_checkout_amount = Column(Float, default=5000)

    short_time_hours = Column(String(10), default="2")
    late_checkout_time = Column(String(10), default="2")
    half_day_duration = Column(String(10), default="6")

    # The rate is interms of percentages.
    vat_rate = Column(Float, default=7.5)
    cat_rate = Column(Float, default=5)
