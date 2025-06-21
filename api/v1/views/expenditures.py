#!/usr/bin/python3
"""Handle API request for expenditure module"""
from models.expenditure import Expenditure
from datetime import date, datetime
from flask import abort, jsonify, request
from api.v1.views import api_views
from api.v1.views.utils import nigeria_today_date,role_required, bad_request
from models.daily_expenditure_sum import DailyExpenditureSum
from models import storage
from sqlalchemy.exc import IntegrityError


@api_views.route("/expenditures", methods=["POST"])
@role_required(["manager", "admin"])
def add_expenditure(user_role: str, user_id: str):
    """Add new Expenditure entry"""

    # Get JSON data from the request
    data = request.get_json()

    # Required fields for the VA entry
    required_fields = ["title", "description", "amount"]
    error_response = bad_request(data, required_fields)
    if error_response:
        return jsonify(error_response), 400

    # Add the expenditure to daily expenditure sum.
    today_date =  nigeria_today_date()
    expense_summation = storage.get_by(
        DailyExpenditureSum, entry_date=today_date
    )

    # Add new daily expenditure if exists else increase sum by existing one
    if not expense_summation:
        expenditure_sum = DailyExpenditureSum(
            entry_date=today_date, amount=data.get("amount")
        )
        storage.new(expenditure_sum)
    else:
        expense_summation.amount += float(data.get("amount"))

    try:
        expenditure = Expenditure(**data)
        storage.new(expenditure)
        storage.save()  # Commit all changes.
        expenditure = storage.get_by(Expenditure, id=expenditure.id)
        return jsonify(expenditure.to_dict())
    except Exception as e:
        print(str(e))
        abort(500)

    finally:
        # Close the database session
        storage.close()


@api_views.route("/expenditures")
@role_required(["manager", "admin"])
def get_expenditures(user_role: str, user_id: str):
    """Retrieve all expenditure from databases."""
    expenditures = storage.all(Expenditure).values()

    if not expenditures:
        return jsonify([]), 200

    sorted_expenditures = sorted(
        expenditures,
        key=lambda expenditure : expenditure.updated_at,
        reverse=True
    )
    storage.close()

    return jsonify([
        expenditure.to_dict()
        for expenditure in sorted_expenditures
    ]), 200


@api_views.route("/expenditures/<string:expense_id>/get")
@role_required(["manager", "admin"]) 
def get_expenditure(user_role: str, user_id: str, expense_id: str):
    """Get expenditure by it ID."""
    expenditure = storage.get_by(Expenditure, id=expense_id)
    if not expenditure:
        abort(404)
    storage.close()
    return jsonify(expenditure.to_dict())


@api_views.route("/expenditures/<string:start_date>/<string:end_date>/get")
@role_required(["manager", "admin"])
def get_expenditure_by_date(
    user_role: str, user_id: str, start_date: str, end_date: str
):
    """Retrieve expenditur at a range of time."""
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")

    # Retrieve expenditure at an interval of time
    expenditures = storage.get_by_date(
        Expenditure, start_date_obj, end_date_obj, "created_at"
    )
    daily_expenditure_sum = storage.get_by_date(
        DailyExpenditureSum, start_date_obj, end_date_obj, "entry_date"
    )

    # Handle case were there is no expenditure
    if not expenditures or not daily_expenditure_sum:
        return jsonify([]), 200

    sorted_expenditures = sorted(
        expenditures,
        key=lambda expenditure : expenditure.updated_at,
        reverse=True
    )

    expenditure_accumulated_sum = sum(
        expense_daily_sum.amount
        for expense_daily_sum in daily_expenditure_sum
    )
    storage.close()
    return jsonify({
        "daily_expenditures": [
            expenditure.to_dict()
            for expenditure in sorted_expenditures
        ],
        "daily_expenditure_sum": expenditure_accumulated_sum
    }), 200


@api_views.route("/expenditures/<expenditure_id>/delete", methods=["DELETE"])
@role_required(["manager", "admin", "staff"])
def delete_expenditure(user_role: str, user_id: str, expenditure_id: str):
    """Delete expenditure by it ID's."""
    try:
        expenditure = storage.get_by(Expenditure, id=expenditure_id)

        if not expenditure:
            abort(404) 

        # Deduct expenses from daily_expenditures_sum table before deleting
        expenses_sum_date = expenditure.created_at.strftime("%Y-%m-%d")
        expenses_sum_amount = expenditure.amount
        expense_summation = storage.get_by(
            DailyExpenditureSum, entry_date=expenses_sum_date  
        ) 
        expense_summation.amount -= expenses_sum_amount

        storage.delete(expenditure)
        storage.save()
        return jsonify({"message": "Deleted Successfully"}), 200
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()
