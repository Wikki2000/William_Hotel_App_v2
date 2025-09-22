#!/usr/bin/python3
"""Populate the drinks table in database."""
from models import storage
from models.drink import Drink
from seed_data.utils import read_json_file
from random import choice


json_file_path = 'seed_data/drinks/drinks.json';

drink_data = read_json_file(json_file_path)

price_list = [1000, 2000, 3000, 500, 900, 800]
#terminals = ["t1", "t2"]
terminals = ["t2"]
for terminal in terminals:
    for drink in drink_data:
        """
        if terminal == "t1":
            drink["terminal"] = "t1"
        else:
        """
        drink.update({
                "terminal": "t2",
                "amount_room": choice(price_list),
                "amount_open_bar": choice(price_list),
                "amount_game_house": choice(price_list),
                "amount_club_house": choice(price_list),
                "amount_private_lounge": choice(price_list),
                "amount_vip_lounge": choice(price_list),
        })
        new_drink = Drink(**drink)
        storage.new(new_drink)
storage.save()
storage.close()
print("Drink data successfully inserted!")
