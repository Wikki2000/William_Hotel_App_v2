#!/usr/bin/python3
"""Populate the rooms table in database."""
from models import storage
from models.room import Room
from seed_data.utils import read_image_file, get_file_names


standard_room_price = 19500
deluxe_room_price = 22500
studio_room_price = 20000
classic_room_price = 30000
FILE_PATH_PREFIX = "/static/images/room_images"
rooms_attr = [
    {
        "name": "standard", "number": "101", "amount": standard_room_price,
        #"image": read_image_file('seed_data/rooms/images/101.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/101.jpg', "terminal": "t1",
    },
    {
        "name": "standard", "number": "102", "amount": standard_room_price,
        #"image": read_image_file('seed_data/rooms/images/102.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/102.jpg', "terminal": "t1",
    },
    {
        "name": "standard", "number": "103", "amount": standard_room_price,
        #"image": read_image_file('seed_data/rooms/images/103.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/103.jpg', "terminal": "t1",
    },
    {
        "name": "standard", "number": "104", "amount": standard_room_price, 
        #"image": read_image_file('seed_data/rooms/images/104.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/104.jpg', "terminal": "t1",
    },
    {
        "name": "standard", "number": "105", "amount": standard_room_price, 
        #"image": read_image_file('seed_data/rooms/images/105.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/105.jpg', "terminal": "t1",
    },
    {
        "name": "deluxe", "number": "201", "amount": deluxe_room_price,
        #"image": read_image_file('seed_data/rooms/images/201.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/201.jpg', "terminal": "t1",
    },
    {
        "name": "deluxe", "number": "202", "amount": deluxe_room_price,
        #"image": read_image_file('seed_data/rooms/images/202.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/202.jpg', "terminal": "t1",
    },
    {
        "name": "deluxe", "number": "203", "amount": deluxe_room_price,
        #"image": read_image_file('seed_data/rooms/images/203.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/203.jpg', "terminal": "t1",
    },
    {
        "name": "deluxe", "number": "204", "amount": deluxe_room_price,
        #"image": read_image_file('seed_data/rooms/images/204.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/204.jpg', "terminal": "t1",
    },
    {
        "name": "deluxe", "number": "205", "amount": deluxe_room_price,
        #"image": read_image_file('seed_data/rooms/images/205.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/205.jpg', "terminal": "t1",
    },
    {
        "name": "deluxe", "number": "206", "amount": deluxe_room_price, 
        #"image": read_image_file('seed_data/rooms/images/206.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/206.jpg', "terminal": "t1",
    },
    {
        "name": "deluxe", "number": "207", "amount": deluxe_room_price,
        #"image": read_image_file('seed_data/rooms/images/207.jpg')
        "image_path": f'{FILE_PATH_PREFIX}/207.jpg', "terminal": "t1",
    },

    {
        "name": "studio", "number": "301", "amount": studio_room_price,
        #"image": read_image_file('seed_data/rooms/images/203.jpg')
        "image_path": f"/static/images/public/hotel_logo.png", "terminal": "t2",
    },
    {
        "name": "studio", "number": "302", "amount": studio_room_price,
        #"image": read_image_file('seed_data/rooms/images/204.jpg')
        "image_path": f"/static/images/public/hotel_logo.png", "terminal": "t2",
    },
    {
        "name": "studio", "number": "303", "amount": studio_room_price,
        #"image": read_image_file('seed_data/rooms/images/205.jpg')
        "image_path": f"/static/images/public/hotel_logo.png", "terminal": "t2",
    },
    {
        "name": "classic", "number": "304", "amount": classic_room_price,
        #"image": read_image_file('seed_data/rooms/images/206.jpg')
        "image_path": f"/static/images/public/hotel_logo.png", "terminal": "t2",
    },
    {
        "name": "classic", "number": "305", "amount": classic_room_price,
        #"image": read_image_file('seed_data/rooms/images/207.jpg')
        "image_path": f"/static/images/public/hotel_logo.png", "terminal": "t2",
    }

]

obj_list = [Room(**room_atr) for room_atr in rooms_attr]

try:
    storage.add_many(obj_list)
    storage.save()
    print("Room added successfully!")
except Exception as e:
    print(str(e))
finally:
    storage.close()
