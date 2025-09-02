#!/usr/bin/python3
"""Error Log Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import (
    Column, String, Float, ForeignKey,
    LargeBinary, Index, Text, Boolean,
    DateTime
)
from datetime import datetime

class ErrorLog(BaseModel, Base):
    """Define class for storing errors"""
    __tablename__ = "error_log"

    message = Column(String(255))
    error = Column(Text)
    trace = Column(Text)
    path = Column(String(255))
    method = Column(String(10))
    treated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
