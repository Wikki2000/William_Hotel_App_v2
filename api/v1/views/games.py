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
def update_game(user_id: str, user_role: str, game_id: str) -> Dict:
    """Update game in stock."""
    TODAY_DATE = nigeria_today_date()
    data = request.get_json()

    error_400 = bad_request(data)
    if error_400:
        return jsonify(error_400), 400

    game = storage.get_by(Game, id=game_id)
    if not game:
        abort(404)

    for key, val in data.items():
        if key != 'id':
            setattr(game, key, val)
    setattr(game, "updated_at", TODAY_DATE)
    storage.save()
    game = storage.get_by(Game, id=game_id)
    return jsonify(game.to_dict()), 201


@api_views.route("/games/<game_id>/get")
@role_required(["manager", "admin"])
def get_game(user_id: str, user_role: str, game_id: str) -> Dict:
    """Retrieve game using it ID"""
    game = storage.get_by(Game, id=game_id)
    if not game:
        abort(404)

    return jsonify(game.to_dict()), 200


@api_views.route("/games", methods=["POST"])
@role_required(["manager", "admin"])
def add_game(user_id: str, user_role: str) -> Dict:
    """Add new game in stock."""
    data = request.get_json()
    terminal = session.get("terminal")

    required_fields = ["name", "amount",]
    error_400 = bad_request(data, required_fields)
    if error_400:
        return jsonify(error_404), 400
    data["terminal"] = terminal
    game = Game(**data)
    storage.new(game)
    storage.save()
    game = storage.get_by(Game, id=game.id)
    return jsonify(game.to_dict())


@api_views.route("/games/<string:game_id>/delete", methods=["DELETE"])
@role_required(["manager", "admin"])
def remove_game(user_id: str, user_role: str, game_id: str) -> Dict:
    """Remove game from stock."""
    game = storage.get_by(Game, id=game_id)

    if not game:
        abort(404)
    storage.delete(game)
    storage.save()
    return jsonify({"message": "Game successfully remove from stock"}), 200
