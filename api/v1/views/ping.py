#!/usr/bin/python3
"""Check status of API."""
from api.v1.views import api_views


@api_views.route("/ping")
def ping():
    """Check Internet Connection."""
    return "", 200
