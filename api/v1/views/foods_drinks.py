#!/usr/bin/python3
"""Handle API request for Food & Drink class"""
from models.food import Food
from models.drink import Drink
from flask import abort, jsonify, request
from api.v1.views import api_views
from api.v1.views.utils import bad_request, role_required
from models import storage
from typing import Dict


@api_views.route("/foods/drinks")
@role_required(["manager", "staff", "admin"])
def get_drinks_foods(user_id: str, user_role: str) -> Dict:
    """Retrieve drinks and foods in databases."""
    try:
        foods = storage.all(Food).values()
        drinks = storage.all(Drink).values()

        sorted_foods = sorted(foods, key=lambda food : food.name)
        sorted_drinks = sorted(drinks, key=lambda drink : drink.name)

        foods_response = [food.to_dict() for food in sorted_foods]
        drinks_response = [drink.to_dict() for drink in sorted_drinks]

        return jsonify({
            "foods": foods_response,
            "drinks": drinks_response
        }), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": "Internal Error Occured"}), 500
    finally:
        storage.close()
