#!/usr/bin/python3
"""book Module"""
from datetime import datetime
from models.base_model import Base, BaseModel
from models.receipt import Receipt
from sqlalchemy import (
    Column, String, ForeignKey, Boolean, Float, Date
)
from sqlalchemy.dialects.mysql import ENUM
from sqlalchemy.orm import relationship


class Booking(BaseModel, Base):
    """Define class for storing booking of rooms"""
    __tablename__ = "bookings"
    duration = Column(String(20))
    payment_type = Column(String(50), nullable=False)
    checkin = Column(Date, nullable=False)
    checkout = Column(Date)
    is_paid = Column(ENUM("yes", "no"), nullable=False, default="no")
    is_use = Column(Boolean, default=True)
    terminal = Column(String(10), nullable=False)

    # Set flag for types of booking
    is_short_rest = Column(Boolean, default=False)
    is_late_checkout = Column(Boolean, default=False)
    is_reserve = Column(Boolean, default=False)
    is_half_booking = Column(Boolean, default=False)
    is_early_checkin = Column(Boolean, default=False)

    guest_number = Column(String(30), nullable=False)
    amount = Column(Float, nullable=False)
    customer_id = Column(
        String(60), ForeignKey("customers.id"), nullable=False
    )
    room_id = Column(
        String(60), ForeignKey("rooms.id"), nullable=False
    )

    # Foreign key to staff that checkin & checkout guest from hotel
    checkin_by_id = Column(
        String(60), ForeignKey("users.id"), nullable=False
    )
    checkout_by_id = Column(String(60), ForeignKey("users.id"))


    receipt = relationship('Receipt', backref='booking', uselist=False,
                            cascade='all, delete-orphan')
