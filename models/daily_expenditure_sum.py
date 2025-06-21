#!/usr/bin/python3
"""daily_expenditure_sum Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import Column, Float, Date, String


class DailyExpenditureSum(BaseModel, Base):
    """Define class for storing summation of expenditures"""
    __tablename__ = "daily_expenditures_sum"
    amount = Column(Float, nullable=False)
    entry_date = Column(Date, nullable=False, unique=True)
    terminal = Column(String(10), nullable=False)
