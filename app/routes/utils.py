#!/usr/bin/python3
"""Define function needed accross different files."""
from uuid import uuid4
from models.room import Room
from models.drink import Drink
from models.food import Food
from models.game import Game
from models.laundry import Laundry
from models import storage
import traceback
from models.error_log import ErrorLog
from flask import request


def cache_burst_versioning(version_id="v6"):
    """Version ID for static files cache bursting."""
    return version_id if version_id else str(uuid4())


def get_service(category):
    models = {
        "foods": Food, "drinks": Drink,
        "games": Game, "laundry": Laundry,
        "rooms": Room
    }

    if category not in models:
        return None

    service = storage.all_get_by(models.get(category))
    sorted_services = sorted(service, key=lambda service : service.name)
    items = [item.to_dict() for item in sorted_services]
    return items


def log_exception(e):
    """ Log error to database. """
    error_log = ErrorLog(
        message="Unhandled Exception",
        error=str(e),
        trace=traceback.format_exc(),
        path=request.path,
        method=request.method,
    )
    storage.new(error_log)
    storage.save()
