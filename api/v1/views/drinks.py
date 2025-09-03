#!/usr/bin/python3
"""Handle API request for Drink class"""
from models.drink import Drink
from flask import abort, jsonify, request, session
from api.v1.views import api_views
from api.v1.views.utils import (
    bad_request, role_required, record_additional_stock
)
from models import storage
from typing import Dict


@api_views.route("/drinks")
@role_required(["manager", "staff", "admin"])
def get_drinks(user_id: str, user_role: str) -> Dict:
    """Retrieve drinks data stored in databases."""
    try:
        terminal = session.get("terminal")
        drinks = storage.all_get_by(Drink, terminal=terminal)
        if not drinks:
            return jsonify([]), 200
        sorted_drinks = sorted(drinks, key=lambda drink : drink.name)
        return jsonify([drink.to_dict() for drink in sorted_drinks]), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": "Internal Error Occured"}), 500
    finally:
        storage.close()


@api_views.route("/drinks", methods=["POST"])
@role_required(["manager", "admin"])
def add_drink(user_id: str, user_role: str) -> Dict:
    """Add new drink in stock."""
    terminal = session.get("terminal")
    data = request.get_json()

    required_fields = ["name", "qty_stock"]
    error_404 = bad_request(data, required_fields)
    if error_404:
        return jsonify(error_404), 400
    data["terminal"] = terminal
    data["amount"] = data.get("amount", 0)
    drink = Drink(**data)
    storage.new(drink)
    storage.save()
    drink = storage.get_by(Drink, id=drink.id)
    storage.close()
    return jsonify(drink.to_dict())


@api_views.route("/drinks/<drink_id>/update", methods=["PUT"])
@role_required(["manager", "admin"])
def update_drink(user_id: str, user_role: str, drink_id: str) -> Dict:
    """Update drink."""
    data = request.get_json()

    error_404 = bad_request(data)
    if error_404:
        return jsonify(error_404), 400

    drink = storage.get_by(Drink, id=drink_id)
    if not drink:
        abort(404)

    stock_type = "drink"
    stock_new_qty = data.get("qty_stock")
    stock_old_qty = drink.qty_stock
    record_additional_stock(
        stock_type, drink_id, stock_new_qty, stock_old_qty
    )
    for key, val in data.items():
        if key != 'id':
            setattr(drink, key, val)
    storage.save()
    updated = storage.get_by(Drink, id=drink_id)
    storage.close()
    return jsonify(updated.to_dict()), 201


@api_views.route("/drinks/<string:drink_id>/delete", methods=["DELETE"])
@role_required(["manager", "admin"])
def remove_drink(user_id: str, user_role: str, drink_id: str) -> Dict:
    """Remove drink from stock."""
    drink = storage.get_by(Drink, id=drink_id)

    if not drink: 
        abort(404)
    storage.delete(drink)
    storage.save()
    storage.close()
    return jsonify({"message": "Drink successfully remove from stock"}), 200


@api_views.route("/drinks/<drink_id>/get")
@role_required(["manager", "admin"])
def get_drink(user_id: str, user_role: str, drink_id: str) -> Dict:
    """Retrieve drink using it ID"""
    drink = storage.get_by(Drink, id=drink_id)
    if not drink:
        abort(404)

    storage.close()
    return jsonify(drink.to_dict()), 200
