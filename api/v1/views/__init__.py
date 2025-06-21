#!/usr/bin/python3
"""Create the Blueprint of Flask"""
from flask import Blueprint

api_views = Blueprint('api_views', __name__)

from api.v1.views.auth.login import *
from api.v1.views.auth.logout import *
from api.v1.views.auth.password_recovery import *
from api.v1.views.users import *
from api.v1.views.rooms import * 
from api.v1.views.customers import *
from api.v1.views.bookings import *
from api.v1.views.foods_drinks import *
from api.v1.views.foods import *
from api.v1.views.drinks import *
from api.v1.views.orders import *
from api.v1.views.loan_request import *
from api.v1.views.leave_request import *
from api.v1.views.users_groups import *
from api.v1.views.messages import *
from api.v1.views.vendors import *
from api.v1.views.maintenaces import *
from api.v1.views.tasks import *
#from api.v1.views.cats import *
from api.v1.views.expenditures import *
from api.v1.views.sales import *
from api.v1.views.inventories import *   
from api.v1.views.games import *
from api.v1.views.laundries import *
from api.v1.views.sale_comments import *
