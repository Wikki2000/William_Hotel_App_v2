#!/usr/bin/python3
"""This module models the storage of admin details."""
from models.base_model import Base, BaseModel
from sqlalchemy import Column, String
from werkzeug.security import generate_password_hash, check_password_hash


class Dev(BaseModel, Base):
    """Define class for storing admins"""
    __tablename__ = "admins"
    username = Column(String(20), unique=True)
    email = Column(String(225), nullable=False, unique=True)
    password = Column(String(1500), nullable=False)

    # ===================== Method Definition ==================== #
    def hash_password(self):
        """Hash password before storing in database."""
        self.password = generate_password_hash(self.password)

    def check_password(self, password):
        """Verify password and give access."""
        return check_password_hash(self.password, password)
