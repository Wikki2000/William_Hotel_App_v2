#!/usr/bin/python3
"""Expenditure Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import Column, String, Text, Float


class Expenditure(BaseModel, Base):
    """Define class for storing expenditures"""
    __tablename__ = "expenditures"
    title =  Column(String(20), nullable=False)
    description = Column(Text)
    amount = Column(Float, nullable=False)
