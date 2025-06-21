#!/usr/bin/python3
"""Update a Drink"""
from models import storage
from models.drink import Drink
import os

image_file = input("Enter Drink Image File Name: ")
image_path = f"/static/images/drink_images/{image_file.strip()}"

# Get all file's in directory
directory_files = os.listdir("app/static/images/drink_images/")
if not image_file in directory_files:
    exit(f"{image_file} not found in app/static/images/drink_images/ directory")

name = input("Enter Drink name: ")
drink = storage.get_by(Drink, name=name.strip())
if not drink:
    exit(f"{name} does not exists")
drink.image_path = image_path
storage.save()
print(f"{name} image with path {image_path} updated successfully")
