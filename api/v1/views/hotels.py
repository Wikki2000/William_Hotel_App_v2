#!/usr/bin/python3
"""Handle API request for all staff members"""
from flask import abort, jsonify, request, session
from api.v1.views import api_views
from api.v1.views.utils import role_required, bad_request
from models import storage
from models.hotel_setting import HotelSetting
from models.user import User
from flask_jwt_extended import jwt_required
from datetime import datetime, date
import json
import os


@api_views.route("/hotel_settings")
@role_required(["admin", "manager"])
def get_settings(user_role: str, user_id: str):
    """Get Hotel Setting."""
    hotel_setting = storage.get_by(HotelSetting)
    if not hotel_setting:
        abort(404)
    return jsonify(hotel_setting.to_dict()), 200


@api_views.route("/hotel_settings", methods=["PUT"])
@role_required(["admin", "manager"])
def update_hotel(user_role: str, user_id: str):
    """Update Hotel Setting
    """
    data = request.get_json()
    try:
        hotel_setting = storage.get_by(HotelSetting)
        if not hotel_setting:
            abort(404)

        for key, val in data.items():
            if val and key != "id":
                setattr(hotel_setting, key, val)
        storage.save()
        return jsonify({"messages": "Hotel Setting Updated Successfully"}), 201
    except Exception as e:
        print(str(e))
        return jsonify({"error": "An Error Occured"}), 500
    finally:
        storage.close()
