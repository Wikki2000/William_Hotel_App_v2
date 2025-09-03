#!/usr/bin/python3
"""Handle API request for transactions module"""
from models.expenditure import Expenditure
from datetime import date, datetime
from flask import abort, jsonify, request, session
from api.v1.views import api_views
from api.v1.views.utils import role_required, bad_request, get_payment_totals
from models.sale import Sale
from models.order_item import OrderItem
from models.daily_drink_stock import DailyDrinkStock
from models.daily_food_stock import DailyFoodStock
from models.drink import Drink
from models.food import Food
from models.game import Game
from models.laundry import Laundry
from models.room import Room
from models import storage
from sqlalchemy.exc import IntegrityError


@api_views.route("/sales")
@role_required(["manager", "admin"])
def get_sales(user_role: str, user_id: str):
    """Retrieve all sales from databases."""
    terminal = session.get("terminal")
    sales = storage.all_get_by(Sale, terminal=terminal)

    if not sales:
        return jsonify([]), 200

    sorted_sales = sorted(
        sales,
        key=lambda sale : sale.updated_at,
        reverse=True
    )
    storage.close()

    return jsonify([
        sale.to_dict()
        for sale in sorted_sales[:31]
    ]), 200


@api_views.route("/sales/<string:sale_id>/get")
@role_required(["manager", "admin"])
def get_sale(user_role: str, user_id: str, sale_id: str):
    """Get sales by it ID's"""
    terminal = session.get("terminal")
    sess = storage.session
    sale = sess.query(Sale).filter_by(id=sale_id).first()
    if not sale:
        abort(404)

    paymet_totals = get_payment_totals(sess, sale.entry_date, terminal)
    sess.close()
    return jsonify({**sale.to_dict(), **paymet_totals})


@api_views.route("/sales/<string:start_date>/<string:end_date>/get")
@role_required(["manager", "admin"])
def get_sale_by_date(
    user_role: str, user_id: str, start_date: str, end_date: str
):
    """Retrieve sales at any interval of time."""
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
    terminal = session.get("terminal")

    # Retrieve expenditure at an interval of time
    sales = storage.get_by_date(
        Sale, start_date_obj, end_date_obj, 
        "entry_date", terminal=terminal
    )

    # Handle case were there is no expenditure
    if not sales:
        return jsonify([]), 200

    sorted_sales = sorted(
        sales,
        key=lambda sale : sale.updated_at,
        reverse=True
    )

    accumulated_sum = sum(
        sale.food_sold + sale.drink_sold + sale.room_sold +
        sale.laundry_sold + sale.game_sold for sale in sorted_sales
    )
    storage.close()
    return jsonify({
        "daily_sales": [
            sale.to_dict()
            for sale in sorted_sales
        ],
        "accumulated_sum": accumulated_sum
    }), 200


@api_views.route(
    "/sales/<string:start_date>/<string:end_date>/<string:service>"
)
@role_required(["manager", "admin", "staff"])
def get_service_sales(
    user_role: str, user_id: str, start_date: str, end_date: str, service: str
):
    """Retrieve sales of a particular service at any interval of time."""
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
    terminal = session.get("terminal")

    service_mapping = {
        "food": "food_id",
        "drink": "drink_id",
        "game": "game_id",
        "room": "room_id",
        "laundry": "laundry_id"
    }

    service_field = service_mapping.get(service)

    if not service_field:
        return jsonify([]), 200  # Invalid service, return empty list

    # Retrieve sales filtered by date range and service type
    sales = storage.get_by_date(
        OrderItem, start_date_obj, end_date_obj,
        "created_at", terminal=terminal
    )

    # Filter results based on the specific service field
    filtered_sales = [
        sale for sale in sales if getattr(sale, service_field, None) is not None
    ]

    sorted_sales = sorted(
        filtered_sales, key=lambda sale: sale.updated_at, reverse=True
    )
    response = [
        {
            "item_name": (
                sale.drink.name if sale.drink_id
                else sale.laundry.name if sale.laundry_id
                else sale.game.name if sale.game_id
                else sale.food.name if sale.food_id
                else None
            ),
            "customer": sale.order.customer.name,
            "quantity": sale.qty_order,
            "is_paid": sale.order.is_paid,
            "amount": sale.amount,
            "order_id": sale.id
        }
        for sale in sorted_sales
    ]
    storage.close()
    return jsonify(response), 200


@api_views.route(
    "/sales/<string:start_date>/<string:end_date>/<string:service>/group-summary"
)
@role_required(["manager", "admin"])
def get_sales_summary(
    user_role: str, user_id: str, start_date: str, end_date: str, service: str
):
    """Retrieve sales of a particular service at any interval of time."""
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
    terminal = session.get("terminal")

    services = {
        "food": Food, "drink": Drink,
        "game": Game, "laundry": Laundry,
        "room": Room
    }

    stock_record_modal = {
        "drink": DailyDrinkStock,
        "food": DailyFoodStock
    }
    if not service in services:
        raise ValueError("Invalid Service Type")

    # Retrieve sales filtered by date range and service type
    sales = storage.get_grouped_items(
        service, start_date_obj, end_date_obj, terminal
    )
    if not sales:
        return jsonify([]), 200
    
    sales_list = []
    for item_id, total_amount, sold_qty in sales:
        cls = services[service]
        service_obj = storage.get_by(cls, id=item_id)
        previous_stock = getattr(service_obj, 'qty_stock', 0) if service_obj else 0

        stock_value = {
            "opening": 0,
            "spoilage": 0,
            "total_in": 0,
            "remaining": 0,
            "additional": 0,
        }

        if service in stock_record_modal:
            stock_record_param = {
                f"{service}_id": item_id,
                "date": start_date_obj
            }
            stock_obj = storage.get_by(
                stock_record_modal[service], **stock_record_param
            )

            if stock_obj:
                stock_value["opening"] = stock_obj.opening
                stock_value["total_in"] = (
                    stock_obj.additional +
                    stock_obj.opening - stock_obj.spoilage
                )
                stock_value["remaining"] = stock_value["total_in"] - sold_qty
                stock_value["additional"] = stock_obj.additional
                stock_value["spoilage"] = stock_obj.spoilage
            else:
                stock_value["opening"] = None
                #stock_value["remaining"] = stock_value["total_in"] - sold_qty
                stock_value["remaining"] = None
                stock_value["total_in"] = None
                stock_value["spoilage"] = None
                stock_value["additional"] = None

        sales_list.append({
            "id": item_id,
            "name": service_obj.name,
            "unit_price": service_obj.amount or 0,
            "opening_stock": stock_value["opening"],
            "additional_stock": stock_value["additional"],
            "remaining_stock": stock_value["remaining"],
            "spoil_stock": stock_value["spoilage"],
            "sold_stock": sold_qty,
            "amount": total_amount,
            "total_in": stock_value["total_in"],
        })

    storage.close()
    return jsonify(sales_list), 200


@api_views.route("/sales/<string:sale_id>/approve-sale", methods=["PUT"])
@role_required(["manager", "admin"])
def approve_daily_sales(user_role: str, user_id: str, sale_id: str):
    """Approved Daily Sales"""
    sale = storage.get_by(Sale, id=sale_id)
    if not sale:
        abort(404)
    sale.is_approved = True
    storage.save()
    storage.close()
    return jsonify({"message": "Sales Record Appproved Successfully"}), 201
