#!/usr/bin/python3
"""This Module accumulate the sum of daily transactions."""
from models.base_model import Base, BaseModel
from sqlalchemy import Column, Text, ForeignKey, String


class SaleComment(BaseModel, Base):
    """Define class for storing comment of daily sale."""
    __tablename__ = "sale_comments"
    comment = Column(Text, nullable=False)
    user_id = Column(String(60), ForeignKey("users.id"), nullable=False)
    sale_id = Column(String(60), ForeignKey("sales.id"), nullable=False)
    terminal = Column(String(10), nullable=False)
