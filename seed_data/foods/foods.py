#!/usr/bin/python3
"""Populate the foods table in database."""
from models import storage
from models.food import Food
from seed_data.utils import read_json_file
from random import choice


json_file_path = 'seed_data/foods/foods.json';
food_data = read_json_file(json_file_path)
price_list = [1000, 2000, 3000, 500, 900, 800]
terminals = ["t1",]

for terminal in terminals:
    for food in food_data:
        if terminal == "t1":
            food["terminal"] = "t1"
        else:
            food.update({
                "terminal": "t2",
                "amount_open_bar": choice(price_list),
                "amount_game_house": choice(price_list),
                "amount_club_house": choice(price_list),
                "amount_private_lounge": choice(price_list),
            })
        new_food = Food(**food)
        storage.new(new_food)

"""
food_data = read_json_file(json_file_path)
obj_list = [Food(**food) for food in food_data]
storage.add_many(obj_list)
"""
storage.save()
print("Food data successfully inserted!")
