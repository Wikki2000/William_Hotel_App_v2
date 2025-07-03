#!/usr/bin/python3
""" Model for handling views for user dashboard. """
from app.routes import app_views
from flask import abort, render_template, request, jsonify
from api.v1.views.utils import role_required
from app.routes.utils import cache_burst_versioning
from datetime import datetime
from uuid import uuid4
from models import storage
from models.user import User


@app_views.route(f"/dashboard")
@role_required(["staff", "manager", "admin"])
#@desktop_only
def dashboarde(user_role: str, user_id: str):
    """"Render templates for user dashboard"""
    today = datetime.today()
    formatted_date = today.strftime("%a %b %d %Y")

    user = storage.get_by(User, id=user_id)
    if not user:
        return redirect(url_for("app_views.login"))
    elif user_role == "staff":
        return render_template(
            "dashboard/staff_dashboard.html",
            today=formatted_date,
            cache_id=cache_burst_versioning()
        )
    elif user_role == "manager" or user_role == "admin":
        return render_template(
            "dashboard/management_dashboard.html",
            today=formatted_date,
            cache_id=cache_burst_versioning()
        )
    else:
        abort(403)
