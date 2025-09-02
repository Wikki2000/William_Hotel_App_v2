#!/usr/bin/python3
""" Model for handling views for guest dashboard. """
from app.routes import app_views
from flask import abort, render_template, request
from app.routes.utils import (
    cache_burst_versioning
)
import os, jwt, secrets
from datetime import datetime, timedelta
from flask import jsonify


JWT_SECRET = os.environ["JWT_SECRET_KEY"]

@app_views.route("/staff/register")
def register_staff():
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "Missing invite token."}), 400

    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Invite expired."}), 400
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid invite token."}), 400

    return render_template(
        f"staff_form.html"
    )
