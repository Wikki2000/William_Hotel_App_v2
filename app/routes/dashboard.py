#!/usr/bin/python3
""" Model for handling views for user dashboard. """
from app.routes import app_views
from flask import abort, render_template, request, jsonify
from api.v1.views.utils import role_required
from datetime import datetime
from uuid import uuid4


@app_views.route(f"/dashboard")
@role_required(["staff", "manager", "admin"])
def dashboarde(user_role: str, user_id: str):
    """"Render templates for user dashboard"""
    today = datetime.today()
    formatted_date = today.strftime("%a %b %d %Y")
    if user_role == "staff":
        return render_template(
            "dashboard/staff_dashboard.html", today=formatted_date, cache_id=uuid4()
        )
    elif user_role == "manager" or user_role == "admin":
        return render_template(
            "dashboard/management_dashboard.html", today=formatted_date, cache_id=uuid4()
        )
    else:
        abort(403)
