#!/usr/bin/python3
"""Handle API request for Laundry class"""
from models.laundry import Laundry
from flask import abort, jsonify, request, session
from api.v1.views import api_views
from api.v1.views.utils import bad_request, role_required
from models import storage
from typing import Dict


@api_views.route("/laundries")
@role_required(["manager", "staff", "admin"])
def get_laundries(user_id: str, user_role: str) -> Dict:
    """Retrieve all laundry stored in databases."""
    try:
        laundries = storage.all_get_by(Laundry)
        if not laundries:
            return jsonify([]), 200
        sorted_laundries = sorted(
            laundries, key=lambda laundry : laundry.name
        )
        return jsonify([laundry.to_dict() for laundry in sorted_laundries]), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": "Internal Error Occured"}), 500
    finally:
        storage.close()

@api_views.route("/laundries", methods=["POST"])
@role_required(["manager", "admin"])
def add_laundry(user_id: str, user_role: str) -> Dict:
    """Add new laundry in stock."""
    data = request.get_json()

    required_fields = ["name", "amount",]
    error_400 = bad_request(data, required_fields)
    if error_400:
        return jsonify(error_404), 400
    laundry = Laundry(**data)
    storage.new(laundry)
    storage.save()
    laundry = storage.get_by(Laundry, id=laundry.id)
    return jsonify(laundry.to_dict())


@api_views.route("/laundries/<laundry_id>/get")
@role_required(["manager", "admin"])
def get_laundry(user_id: str, user_role: str, laundry_id: str) -> Dict:
    """Retrieve laundry using it ID"""
    laundry = storage.get_by(Laundry, id=laundry_id)
    if not laundry:
        abort(404)

    return jsonify(laundry.to_dict()), 200


@api_views.route("/laundries/<string:laundry_id>/delete", methods=["DELETE"])
@role_required(["manager", "admin"])
def remove_laundry(user_id: str, user_role: str, laundry_id: str) -> Dict:
    """Remove game from stock."""
    laundry = storage.get_by(Laundry, id=laundry_id)

    if not laundry:
        abort(404)
    storage.delete(laundry)
    storage.save()
    return jsonify({"message": "Laundry successfully remove from stock"}), 200
