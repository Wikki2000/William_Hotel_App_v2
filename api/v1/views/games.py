#!/usr/bin/python3
"""Handle API request for Game class"""
from models.game import Game
from flask import abort, jsonify, request, session
from api.v1.views import api_views
from api.v1.views.utils import bad_request, role_required
from models import storage
from typing import Dict


@api_views.route("/games")
@role_required(["manager", "staff", "admin"])
def get_games(user_id: str, user_role: str) -> Dict:
    """Retrieve all games stored in databases."""
    try:
        terminal = session.get("terminal") 
        games = storage.all_get_by(Game, terminal=terminal)
        if not games:
            return jsonify([]), 200
        sorted_games = sorted(games, key=lambda game : game.updated_at)
        return jsonify([game.to_dict() for game in sorted_games]), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": "Internal Error Occured"}), 500
    finally:
        storage.close()


@api_views.route("/games/<game_id>/update", methods=["PUT"])
@role_required(["manager", "admin"])
def update_game(user_id: str, user_role: str, food_id: str) -> Dict:
    """Update food in stock."""
    """
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
    return jsonify(food.to_dict()), 201
    """


@api_views.route("/games/<game_id>/get")
@role_required(["manager", "admin"])
def get_game(user_id: str, user_role: str, food_id: str) -> Dict:
    """Retrieve food using it ID"""
    """
    food = storage.get_by(Food, id=food_id)
    if not food:
        abort(404)

    return jsonify(food.to_dict()), 200
    """


@api_views.route("/games", methods=["POST"])
@role_required(["manager", "admin"])
def add_game(user_id: str, user_role: str) -> Dict:
    """Add new food in stock."""
    data = request.get_json()
    terminal = session.get("terminal")

    required_fields = ["name", "amount", "qty_stock"]
    error_404 = bad_request(data, required_fields)
    if error_404:
        return jsonify(error_404), 404
    data["terminal"] = terminal
    food = Food(**data)
    storage.new(food)
    storage.save()
    food = storage.get_by(Food, id=food.id)
    return jsonify(food.to_dict())


@api_views.route("/games/<string:game_id>/delete", methods=["DELETE"])
@role_required(["manager", "admin"])
def remove_game(user_id: str, user_role: str, food_id: str) -> Dict:
    """Remove drink from stock."""
    food = storage.get_by(Food, id=food_id)

    if not food:
        abort(404)
    storage.delete(food)
    storage.save()
    return jsonify({"message": "Food successfully remove from stock"}), 200
