#!/usr/bin/python3
""" Model for handling views for Admin dashboard. """
from app.routes import app_views
from flask import  render_template, abort
from flask_jwt_extended import jwt_required

TEMPLATE_DIRECTORY = "dev/"


@app_views.route("/dev/account/login")
def admin_login():
    return render_template(f"{TEMPLATE_DIRECTORY}login.html")


@app_views.route("/dev/dashboard")
@jwt_required()
def admin_dashboard():
    return render_template(f"{TEMPLATE_DIRECTORY}dashboard.html")


@app_views.route("/dev/error/logs")
@jwt_required()
def log_error():
    return render_template(f"{TEMPLATE_DIRECTORY}error_logs.html")
