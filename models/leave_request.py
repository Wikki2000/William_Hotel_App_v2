#!/usr/bin/python3
"""leave_request Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import (
    Column, Date, String, Text, ForeignKey
)
from sqlalchemy.dialects.mysql import ENUM


class LeaveRequest(BaseModel, Base):
    """Define class for storing leave request by staff."""
    __tablename__ = "leave_requests"
    leave_type = Column(String(40), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    description = Column(Text, nullable=False)
    manager_approval_status = Column(
        ENUM("approved", "pending", "rejected"), default="pending"
    )
    ceo_approval_status = Column(
        ENUM("approved", "pending", "rejected"), default="pending"
    )
    staff_id = Column(
        String(60), ForeignKey("users.id"), nullable=False
    )
    comment = Column(Text)
