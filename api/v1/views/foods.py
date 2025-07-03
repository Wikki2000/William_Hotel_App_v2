#!/usr/bin/python3
"""Handle API request for Food class"""
from models.food import Food
from flask import abort, jsonify, request, session
from api.v1.views import api_views
from api.v1.views.utils import bad_request, role_required
from models import storage
from typing import Dict


@api_views.route("/foods")
@role_required(["manager", "staff", "admin"])
def get_foods(user_id: str, user_role: str) -> Dict:
    """Retrieve foods data stored in databases."""
    try:
        terminal = session.get("terminal")
        foods = storage.all_get_by(Food, terminal=terminal)
        if not foods:
            return jsonify([]), 200
        sorted_foods = sorted(foods, key=lambda food : food.name)
        return jsonify([food.to_dict() for food in sorted_foods]), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": "Internal Error Occured"}), 500
    finally:
        storage.close()


@api_views.route("/foods/<food_id>/update", methods=["PUT"])
@role_required(["manager", "admin"])
def update_food(user_id: str, user_role: str, food_id: str) -> Dict:
    """Update food in stock."""
    data = request.get_json()

    error_404 = bad_request(data)
    if error_404:
        return jsonify(error_404), 400

    food = storage.get_by(Food, id=food_id)
    if not food:
        abort(404)

    for key, val in data.items():
        if key != 'id':
            setattr(food, key, val)
    storage.save()
    food = storage.get_by(Food, id=food_id)
    storage.close()
    return jsonify(food.to_dict()), 201


@api_views.route("/foods/<food_id>/get")
@role_required(["manager", "admin"])
def get_food(user_id: str, user_role: str, food_id: str) -> Dict:
    """Retrieve food using it ID"""
    food = storage.get_by(Food, id=food_id)
    if not food:
        abort(404)

    storage.close()
    return jsonify(food.to_dict()), 200


@api_views.route("/foods", methods=["POST"])
@role_required(["manager", "admin"])
def add_food(user_id: str, user_role: str) -> Dict:
    """Add new food in stock."""
    data = request.get_json()
    terminal = session.get("terminal")

    required_fields = ["name", "qty_stock"]
    error_404 = bad_request(data, required_fields)
    if error_404:
        return jsonify(error_404), 400
    data["terminal"] = terminal
    food = Food(**data)
    storage.new(food)
    storage.save()
    food = storage.get_by(Food, id=food.id)
    storage.close()
    return jsonify(food.to_dict())


@api_views.route("/foods/<string:food_id>/delete", methods=["DELETE"])
@role_required(["manager", "admin"])
def remove_food(user_id: str, user_role: str, food_id: str) -> Dict:
    """Remove drink from stock."""
    food = storage.get_by(Food, id=food_id)

    if not food:
        abort(404)
    storage.delete(food)
    storage.save()
    storage.close()
    return jsonify({"message": "Food successfully remove from stock"}), 200
