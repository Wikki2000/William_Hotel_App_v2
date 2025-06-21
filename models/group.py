#!/usr/bin/python3
"""Group Module"""
from models.base_model import Base, BaseModel
from sqlalchemy import Column, String, LargeBinary
from sqlalchemy.orm import relationship
from models.group_message import GroupMessage

class Group(BaseModel, Base):
    """Define class for storing groups"""
    __tablename__ = "groups"
    image = Column(LargeBinary)
    name =  Column(String(60), nullable=False)
    description = Column(String(500))

    group_messages = relationship('GroupMessage', backref='group',
                         cascade='all, delete-orphan')
