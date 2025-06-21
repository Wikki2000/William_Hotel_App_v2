#!/usr/bin/python3
"""Maintenance Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import (
    Boolean, Column, String, Integer, ForeignKey, Text
)
from sqlalchemy.dialects.mysql import LONGBLOB


class Maintenance(BaseModel, Base):
    """Define class for maintenence list"""
    __tablename__ = "maintenances"
    fault = Column(String(225), nullable=False)
    location = Column(String(225), nullable=False)
    image = Column(LONGBLOB)
    description = Column(Text)
    status = status = Column(Boolean, default=False)
    user_id = Column(String(60), ForeignKey("users.id"))
    terminal = Column(String(10), nullable=False)
