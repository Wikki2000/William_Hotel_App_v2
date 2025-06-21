#!/usr/bin/python3
"""Food Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import (
    Column, String, Boolean, Float, ForeignKey, Integer, LargeBinary
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import ENUM, LONGBLOB
from models.order import Order


class Room(BaseModel, Base):
    """Define class for storing drinks"""
    __tablename__ = "rooms"
    image = Column(LONGBLOB)  # Stores image binary
    image_path = Column(String(225))  # Stores image file path
    name =  Column(String(225), nullable=False)
    terminal = Column(String(10), nullable=False)
    status = Column(
        ENUM("available", "reserved", "occupied"),
        default="available"
    )
    amount = Column(Float, nullable=False)
    number = Column(String(20), nullable=False, unique=True)

    book = relationship('Booking', backref='room',
                         cascade='all, delete-orphan')
