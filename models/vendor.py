#!/usr/bin/python3
"""vendor Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import Column, String, Integer


class Vendor(BaseModel, Base):
    """Define class for vendor list"""
    __tablename__ = "vendors"
    name = Column(String(225), nullable=False)
    portfolio = Column(String(225), nullable=False)
    number = Column(String(225), nullable=False)
