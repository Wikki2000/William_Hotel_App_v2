#!/usr/bin/python3
"""daily_expenditure_sum Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import Column, Float, Date, String, UniqueConstraint


class DailyExpenditureSum(BaseModel, Base):
    """Define class for storing summation of expenditures"""
    __tablename__ = "daily_expenditures_sum"
    amount = Column(Float, nullable=False)
    entry_date = Column(Date, nullable=False)
    terminal = Column(String(10), nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "terminal", "entry_date", name="terminal_per_entry_date"
        ),
    )
