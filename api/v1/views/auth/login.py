#!/usr/bin/python3
"""Sign in user with valid credentials."""
from flask import request, jsonify, session
from models.user import User
from flask_jwt_extended import create_access_token, set_access_cookies
from api.v1.views.utils import nigeria_today_date, write_to_file
import datetime
from api.v1.views import api_views
from models.storage import Storage
from models import storage
from typing import Optional
from flasgger.utils import swag_from


TODAY_DATE = nigeria_today_date()
CURRENT_TIME = time = datetime.datetime.now().strftime("%I:%M %p")
ERROR_LOG_FILE = "logs/error.log"


def login_user(email_or_username: str
) -> Optional[User]:
    """ Get an instance of loged-in-user.

    :email_or_username - E-mail or username of user to be logged-in
    :rtype - The instance of the logged-in-user if found, else None.
    """
    if not email_or_username:
        raise ValueError("email_or_username must be a valid string")

    user = (
        storage.get_by(User, email=email_or_username)
        if "@" in email_or_username else
        storage.get_by(User, username=email_or_username)
    )
    return user


@api_views.route('/account/login', methods=['POST'])
@swag_from('../documentation/auth/login.yml')
def login():
    """Route for user login with JSON data."""
    api_path = request.path
    try:
        # Parse JSON data from request
        data = request.get_json()

        if not data:
            return jsonify({"error": "No input data provided"}), 400

        # Ensure all required fields are in the JSON data
        required_fields = ["email_or_username", "password", "terminal"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "error": f"{', '.join(missing_fields)} Field(s) Missing"
            }), 400

        email_or_username = data.get("email_or_username").strip()
        password = data.get("password")

        user = login_user(email_or_username)

        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid email or password"}), 401

        session["terminal"] = data.get("terminal")
        user.is_active = True
        storage.save()

        # Create JWT token with additional claims
        access_token = create_access_token(
            identity=user.id, additional_claims={"role": user.role}
        )

        # Return response with access token
        response = jsonify({**user.to_dict()})
        set_access_cookies(response, access_token)  # Set JWT in cookie
        return response, 200

    except Exception as e:
        error = f"{CURRENT_TIME}\t{TODAY_DATE}\t{api_path}\t{str(e)}\n\n"
        write_to_file(ERROR_LOG_FILE, error)
        print(str(e))
        return jsonify({"error": "An internal error occurred. Please try again later."}), 500
    finally:
        storage.close()
