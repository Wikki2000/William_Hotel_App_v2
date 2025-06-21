#!/ume",sr/bin/python3
"""This module models the storage of customer/guess details."""
from models.base_model import Base, BaseModel
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import ENUM
from models.booking import Booking
from models.order import Order

class Customer(BaseModel, Base):
    """Define class for storing customers"""
    __tablename__ = "customers"
    name =  Column(String(225), nullable=False)
    address = Column(String(225))
    gender = Column(ENUM("male", "female"))
    phone = Column(String(30))
    is_guest = Column(Boolean, default=False)
    id_type = Column(String(225))
    id_number =  Column(String(225))
    email = Column(String(225))
    terminal = Column(String(10), nullable=False)

    books = relationship('Booking', backref='customer',
                         cascade='all, delete-orphan')
    orders = relationship('Order', backref='customer',
                         cascade='all, delete-orphan')
