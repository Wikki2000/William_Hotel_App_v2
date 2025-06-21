#!/usr/bin/python3
"""Handle API request for vat module"""
"""
from models.vat import Vat
from models.cat import Cat
"""
from flask import abort, jsonify, request
from api.v1.views import api_views
from api.v1.views.utils import role_required, bad_request
from models import storage
from sqlalchemy.exc import IntegrityError
from dateutil.relativedelta import relativedelta
from datetime import date, datetime
from models.sale import Sale



@api_views.route(
    "/tasks/<string:start_date>/<string:end_date>/<string:task_type>/get"
)
@role_required(["manager", "admin"])
def get_vats(
    user_role, user_id, start_date, end_date, task_type
):
    """ Retrieve vats for a duration of time.
    """
    tasks = {"vat": 0.075, "cat": 0.05}
    if not task_type in tasks:
        return jsonify({"Task Not Found"}), 404

    print(start_date, end_date)

    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d") 
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")


    # Retrieve expenditure at an interval of time
    sales = storage.get_by_date(
        Sale, start_date_obj, end_date_obj, "entry_date"
    )


    total_sale = sum(
        sale.food_sold + sale.drink_sold + 
        sale.laundry_sold + sale.game_sold +
        sale.room_sold for sale in sales
    )
    storage.close()
    return jsonify({
        task_type: total_sale * tasks[task_type],
        "sale_amount": total_sale
    }), 200
