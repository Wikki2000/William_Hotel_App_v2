#!/usr/bin/python3
"""Sign in user with valid credentials."""
from flask import request, jsonify, redirect, make_response
from models.dev import Dev
from flask_jwt_extended import create_access_token, set_access_cookies
import datetime
from api.v1.views import api_views
from models.storage import Storage
from models import storage
from typing import Optional
from flasgger.utils import swag_from
import os


@api_views.route('/admin/account/login', methods=['POST'])
@swag_from('../documentation/auth/login.yml')
def admin_login():
    """Route for user login with JSON data."""

    # Parse JSON data from request
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided"}), 400

    # Ensure all required fields are in the JSON data
    required_fields = ["email_or_username", "password"]
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({
            "error": f"{''.join(missing_fields)} Field Missing"
        }), 400

    email_or_username =data.get("email_or_username")
    password = data.get("password")

    #user = login_user(email_or_username, role)
    if not email_or_username:
        raise ValueError("email_or_username must be a valid string")

    user = (
        storage.get_by(Dev, email=email_or_username)
        if "@" in email_or_username else
        storage.get_by(Dev, username=email_or_username)
    )

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Create JWT token
    access_token = create_access_token(identity=user.id)

    # Return response with aceess token
    response =  jsonify({**user.to_dict()})
    set_access_cookies(response, access_token)  # Set JWT in cookie
    storage.save()
    storage.close()
    return response, 200
