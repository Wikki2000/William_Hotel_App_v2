#!/usr/bin/python3
"""Update tyhe status of a room"""
from models import storage
from models.room import Room

room_number = input("Enter room number: ")
if not room_number:
    exit("Please enter a room number")

room = storage.get_by(Room, number=room_number)
if not room:
    exit("Room does not exists")
room.status = "available"
storage.save()
print("Room status updated successfully")
