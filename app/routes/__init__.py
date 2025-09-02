#!/usr/bin/python3
"""Create Blueprint for Application Views."""
from flask import Blueprint

app_views = Blueprint("app_views", __name__)
app_guests = Blueprint("app_guests", __name__)

from app.routes.auth import *
from app.routes.index import *
from app.routes.dashboard import *
from app.routes.receipt import *
from app.routes.member_chat_group import *
from app.routes.guest import *
from app.routes.admin import *
from app.routes.staff import *
