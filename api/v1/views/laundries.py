#!/usr/bin/python3
"""Handle API request for Laundry class"""
from models.laundry import Laundry
from flask import abort, jsonify, request
from api.v1.views import api_views
from api.v1.views.utils import bad_request, role_required
from models import storage
from typing import Dict


@api_views.route("/laundries")
@role_required(["manager", "staff", "admin"])
def get_laundries(user_id: str, user_role: str) -> Dict:
    """Retrieve all laundry stored in databases."""
    try:
        laundries = storage.all(Laundry).values()
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
