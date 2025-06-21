#!/usr/bin/python3
"""Populate the rooms table in database."""
#from models import storage
#from models.room import Room
from seed_data.utils import read_image_file, write_json, read_excel_file
import pandas as pd
from datetime import datetime
from typing import List
from werkzeug.security import generate_password_hash

def read_excel_file(file_path: str) -> List[dict]:
    """Read the data from the Excel file and prepare JSON data with lowercase keys."""
    # Load the Excel file
    data = pd.read_excel(file_path)

    # Convert DataFrame to JSON
    json_data = data.to_dict(orient="records")

    # Clean and serialize the data
    cleaned_data = []
    for record in json_data:
        record.pop("Timestamp", None)
        record.pop("photo", None)
        # Convert keys to lowercase and process values
        cleaned_record = {}
        for key, value in record.items():
            # Convert key to lowercase
            lower_key = key.lower()

            # Check if the value is a Timestamp or datetime and convert to string
            if isinstance(value, (pd.Timestamp, datetime)):
                value = value.strftime("%Y-%m-%d")  # Format as 'YYYY-MM-DD'

            cleaned_record[lower_key] = value

            # Add others important data
            cleaned_record["role"] = "staff"
            cleaned_record["password"] = generate_password_hash("12345")

        cleaned_data.append(cleaned_record)

    return cleaned_data

"""
excel_file_path = "seed_data/users/users.xlsx"
json_file_path = "seed_data/users/users.json"
users_data = read_excel_file(excel_file_path)
write_json(json_file_path, users_data)
"""
