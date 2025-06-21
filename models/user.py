#!/usr/bin/python3
"""This module models the storage of user details."""
from datetime import datetime
from models.base_model import Base, BaseModel
from sqlalchemy import (
    Column, Text, String, Boolean, LargeBinary, DateTime, Float, Integer, JSON
)
from sqlalchemy.dialects.mysql import ENUM, LONGBLOB 
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
from models.booking import Booking
from models.order import Order
from models.loan_request import LoanRequest
from models.leave_request import LeaveRequest
from models.private_message import PrivateMessage
from models.group_message import GroupMessage
from models.maintenance import Maintenance
from models.sale_comment import SaleComment


class User(BaseModel, Base):
    """Define class for storing users"""
    __tablename__ = "users"
    title = Column(String(20))
    first_name = Column(String(225), nullable=False)
    middle_name = Column(String(225))
    last_name =  Column(String(225), nullable=False)
    username = Column(String(20))
    profile_photo = Column(LONGBLOB)
    email = Column(String(225), nullable=False, unique=True)
    address = Column(String(225))
    gender = Column(String(30))
    salary = Column(Float)
    start_date = Column(DateTime)
    dob = Column(DateTime)
    number = Column(String(30))
    nok = Column(String(225))
    nok_number = Column(String(30))
    religion = Column(String(225))
    state = Column(String(225))
    password = Column(String(1500), nullable=False)
    rank_number = Column(String(1500), nullable=False)
    role = Column(ENUM("admin", "manager", "staff"),  nullable=False)
    portfolio = Column(String(1500), nullable=False)
    performance = Column(Integer)
    is_active = Column(Boolean, default=False)
    last_active = Column(DateTime)
    roster = Column(JSON)  # Holds weekly shift from monday to sunday of staffs.

    maintenences = relationship("Maintenance", backref="user")

    # Handle relationship between staff that checkin & checkout guest
    checkin_made_by = relationship(
        'Booking', backref='checkin_by',
        cascade="all, delete-orphan",
        foreign_keys="Booking.checkin_by_id"
    )
    checkout_made_by = relationship(
        'Booking', backref='checkout_by',
        cascade="all, delete-orphan",
        foreign_keys="Booking.checkout_by_id"
    )

    # Handle relationship between staff that made order & cleared bill
    orders_made_by = relationship(
        'Order', backref='ordered_by',
        cascade="all, delete-orphan",
        foreign_keys="Order.ordered_by_id"
    )
    bill_cleared_by = relationship(
        'Order', backref='cleared_by',
        cascade="all, delete-orphan",
        foreign_keys="Order.cleared_by_id"
    )

    # Define relationship with Message class
    sent_messages = relationship(
        "PrivateMessage", backref="sender",
        cascade="all, delete-orphan",
        foreign_keys="PrivateMessage.sender_id"
    )
    recieved_messages = relationship(
        "PrivateMessage", backref="receiver",
        cascade="all, delete-orphan",
        foreign_keys="PrivateMessage.receiver_id"
    )

    # Handle relationship between staff and request for loan
    loans = relationship(
        "LoanRequest", backref="staff",
        cascade="all, delete-orphan",
    )

    # Handle relationship between staff and request for leaves
    leaves = relationship(
        "LeaveRequest", backref="staff",
        cascade="all, delete-orphan",
    )

    group_messages = relationship(
        "GroupMessage", backref="user",
        cascade="all, delete-orphan"
    )

    sale_comments = relationship('SaleComment', backref='user')

    # ===================== Method Definition ==================== #
    def hash_password(self):
        """Hash password before storing in database."""
        self.password = generate_password_hash(self.password)

    def check_password(self, password):
        """Verify password and give access."""
        return check_password_hash(self.password, password)
