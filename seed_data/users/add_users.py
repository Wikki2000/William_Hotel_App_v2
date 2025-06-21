#!/usr/bin/python3
"""Populate the foods table in database."""
from models import storage
from models.user import User
from seed_data.utils import read_json_file


json_file_path = 'seed_data/users/users.json';

user_data = read_json_file(json_file_path)
obj_list = [User(**user) for user in user_data]
storage.add_many(obj_list)
storage.save()
print("User data successfully inserted!")
