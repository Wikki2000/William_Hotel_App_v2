#!/usr/bin/python3
"""Populate the foods table in database."""
from models import storage
from models.game import Game
from seed_data.utils import read_json_file, read_image_file


#json_file_path = 'seed_data/games/games.json';

game_data = [
    {
        "name": "Snooker",
        "amount": 1000,
        "image": read_image_file("seed_data/games/images/snooker.webp"),
        "terminal": "t1",
    },
    {
        "name": "Snooker",
        "amount": 2000,
        "image": read_image_file("seed_data/games/images/snooker.webp"),
        "terminal": "t2",
    },
    {
        "name": "PS 3",
        "amount": 1000,
        #"image": read_image_file("seed_data/games/images/snooker.webp")
        "terminal": "t2",
    },
    {
        "name": "PS 4",
        "amount": 1500,
        #"image": read_image_file("seed_data/games/images/snooker.webp")
        "terminal": "t2",
    },
    {
        "name": "PS 5",
        "amount": 2000,
        #"image": read_image_file("seed_data/games/images/snooker.webp")
        "terminal": "t2",
    },
    {                                                                           
        "name": "Table Tennis",                                                     
        "amount": 1000, 
        "terminal": "t2",
    },
]

#game_data = read_json_file(json_file_path)
obj_list = [Game(**game) for game in game_data]
storage.add_many(obj_list)
storage.save()
print("Games Added successfully !")
