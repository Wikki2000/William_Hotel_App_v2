#!/usr/bin/python3
"""This module models the storage of users message."""
from models.base_model import Base, BaseModel
from datetime import datetime
from sqlalchemy import (
    Column, Text, String, ForeignKey, LargeBinary, Boolean
)


class PrivateMessage(BaseModel, Base):
    """Define the class model for messages b/w two users."""
    __tablename__ = "private_messages"
    sender_id = Column(
        String(50),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    receiver_id = Column(
        String(50),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    text = Column(Text)
    media = Column(LargeBinary)
    is_read = Column(Boolean, default=False)
