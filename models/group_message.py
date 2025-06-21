#!/usr/bin/python3
"""This module models the storage of group message."""
from models.base_model import Base, BaseModel
from datetime import datetime
from sqlalchemy import (
    Column, Text, String, ForeignKey, LargeBinary, Boolean
)


class GroupMessage(BaseModel, Base):
    """Define the class model for storing group messages."""
    __tablename__ = "group_messages"
    user_id = Column(
        String(50),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    group_id = Column(
        String(50),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False
    )
    text = Column(Text)
    media = Column(LargeBinary)
    is_read = Column(Boolean, default=False)
