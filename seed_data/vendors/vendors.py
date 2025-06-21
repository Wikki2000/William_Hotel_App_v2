#!/usr/bin/python3
"""Populate the vendors table in database."""
from models import storage
from models.vendor import Vendor
from seed_data.utils import read_json_file


json_file_path = 'seed_data/vendors/vendors.json';

vendor_data = read_json_file(json_file_path)
obj_list = [Vendor(**vendor) for vendor in vendor_data]
storage.add_many(obj_list)
storage.save()
print("Vendor data successfully inserted!")
