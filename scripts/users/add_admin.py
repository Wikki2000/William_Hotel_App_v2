#!/usr/bin/python3
"""Add Admin user."""
from models import storage
from models.user import User
from seed_data.utils import read_image_file, get_file_names
from models.group import Group
from models.group_message import GroupMessage

try:
    attr = {
                "first_name": "David", "last_name": "Moses",
                "username": "david", "performance": 100,
                "password": "12345", "email": "david@gmail.com",
                "role": "admin", "portfolio": "CEO", "rank_number": 0
            }
    gp = Group(name="WCHS Group")
    storage.new(gp)
    storage.save()

    group = storage.get_by(Group, name="WCHS Group")
    if not group:
        print("Error! You must create the WCHS Group")
        exit()

    user = User(**attr)
    user.hash_password()
    storage.new(user)
    storage.save()

    msg = "Welcome to the team! Excited to achieved great things together."
    welcome_msg = GroupMessage(group_id=group.id, text=msg, user_id=user.id)
    storage.new(welcome_msg)
    storage.save()
    print("Admin user created successfully!")
except Exception as e:
    print(str(e))
finally:
    storage.close()
