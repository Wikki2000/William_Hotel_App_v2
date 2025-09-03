#!/usr/bin/python3
"""Handle API request for order module"""
from models.user import User
from models.customer import Customer
from models.order import Order
from models.drink import Drink
from models.food import Food
from models.order_item import OrderItem
from models.booking import Booking
from models.sale import Sale
from flask import abort, jsonify, request, session
from api.v1.views import api_views
from api.v1.views.utils import (
    bad_request, create_receipt, role_required, nigeria_today_date,
    update_item_stock, rollback_order_on_error, update_sales_data,
    write_to_file, update_room_sold, get_url_param, is_duplicate_order
)
from api.v1.views import constant
from models import storage
from sqlalchemy.exc import IntegrityError
from datetime import datetime, date
from random import randint


ERROR_LOG_FILE = "logs/error.log"

@api_views.route("/order-items")
@role_required(["staff", "manager", "admin"])
def get_orders(user_role: str, user_id: str):
    """Retrieve all order items"""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    terminal = session.get("terminal")
    api_path = request.path
    try:
        start_date_obj = end_date_obj = TODAY_DATE
        search_string = request.args.get('search_string');
        url_query = request.args
        filter_param = get_url_param(url_query)
        orders = []

        if not search_string and not filter_param:
            orders = storage.get_by_date(
                Order, start_date_obj, end_date_obj, "created_at", terminal=terminal
            )
        elif filter_param:
            parameters = {}

            parameters["terminal"] = terminal

            # Handle filtering base on payment status
            payment_status_available = {"pending": False, "paid": True}
            if filter_param.get("payment_status") in payment_status_available:
                parameters["is_paid"] = payment_status_available[filter_param.get("payment_status")]
            if filter_param.get("start_date"):
                parameters["start_date"] = filter_param.get("start_date")
            if filter_param.get("end_date"):
                parameters["end_date"] = filter_param.get("end_date")
            orders = storage.all_get_by(Order, **parameters)

        elif search_string:
            guests = storage.get_start_with(
                Customer, "name", search_string, terminal
            )

            for guest in guests:

                # Retrieve orders made by a guest corresponding to search string
                # Many orders can be made by one guest.
                orders_by_guest = storage.all_get_by(
                    Order, customer_id=guest.id, is_paid=False
                )

                for order in orders_by_guest:
                    orders.append(order)
                #orders.extend(orders_by_guest)

        if not orders:
            return jsonify([]), 200

        sorted_orders = sorted(
            orders, key=lambda order : order.customer.name, #reverse=True
        )
        obj = sorted_orders[0]
        response = [{
            "order": order.to_dict(),
            "customer": order.customer.to_dict(),
            "user": order.ordered_by.to_dict(),
            "order_items": [
                {
                    "qty": order_item.qty_order,
                    "amount": order_item.amount,
                    "name": (
                        order_item.drink.name
                        if order_item.drink_id
                        else order_item.food.name if order_item.food_id
                        else order_item.game.name if order_item.game_id
                        else None
                    )
                } for order_item in order.order_items]
        } for order in sorted_orders]
        return jsonify(response), 200
    except Exception as e:
        print(str(e))
        error = f"{CURRENT_TIME}\t{TODAY_DATE}\t{api_path}\t{str(e)}\n\n"
        write_to_file(ERROR_LOG_FILE, error)
        return jsonify({"error": str(e)}), 500
    finally:
        storage.close()


@api_views.route("/orders/<string:order_id>/order-items")
@role_required(["staff", "manager", "admin"])
def get_order(user_role: str, user_id: str, order_id: str):
    """Retrieve order by it ID"""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    api_path = request.path
    try:
        order = storage.get_by(Order, id=order_id)
        if not order:
            abort(404)

        cleared_by_dict = (
            None if not order.cleared_by else order.cleared_by.to_dict()
        )

        response = {
            "order": {
                **order.to_dict(),
                "order_receipt": order.receipt.receipt_no
            },
            "customer": order.customer.to_dict(),
            "ordered_by": order.ordered_by.to_dict(),
            "cleared_by": cleared_by_dict,
            "order_items": [
                {
                    "qty": order_item.qty_order,
                    "amount": order_item.amount,
                    "name": (
                        order_item.drink.name if order_item.drink_id
                        else order_item.food.name if order_item.food_id
                        else order_item.game.name if order_item.game_id
                        else order_item.laundry.name if order_item.laundry_id
                        else None
                    ),
                    "price": (
                        order_item.drink.amount if order_item.drink_id
                        else order_item.food.amount if order_item.food_id
                        else order_item.game.amount if order_item.game_id
                        else order_item.laundry.amount if order_item.laundry_id
                        else None
                    )
                } for order_item in order.order_items]
        }
        return jsonify(response), 200
    except Exception as e:
        print(str(e))
        error = f"{CURRENT_TIME}\t{TODAY_DATE}\t{api_path}\t{str(e)}\n\n"
        write_to_file(ERROR_LOG_FILE, error)
        return jsonify({"error": str(e)}), 500
    finally:
        storage.close()


@api_views.route("/orders/<string:order_id>/update-payment", methods=["PUT"])
@role_required(["staff", "manager", "admin"])
def update_status(user_role: str, user_id: str, order_id: str):
    """Clear Bill of Customer."""

    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")

    order = storage.get_by(Order, id=order_id)
    if not order:
        abort(404)
    elif order.is_paid:
        user_obj = order.cleared_by if order.cleared_by else order.ordered_by

        name = (
            "You" if user_id == order.cleared_by.id
            else f"{user_obj.first_name} {user_obj.last_name}"
        )
        return jsonify({"error": f"Bill Already Cleared by {name} !"}), 409

    order.is_paid = True
    order.cleared_by_id = user_id
    order.updated_at = TODAY_DATE
    storage.save()
    storage.close()
    return jsonify({"message": "Payment Status Updated to Paid"}), 200


@api_views.route("/orders/<string:order_id>/payment-method", methods=["PUT"])
@role_required(["staff", "manager", "admin"])
def update_payment_method(user_role: str, user_id: str, order_id: str):
    """Update payment method."""
    order = storage.get_by(Order, id=order_id)
    if not order:
        abort(404)

    payment_method = request.get_json().get("payment_method")
    if not payment_method:
        abort(400, "Invalid JSON")
    order.payment_type = payment_method

    order.updated_by = datetime.now()
    storage.save()
    storage.close()
    return jsonify({"message": "Payment Method Updated Successfully!"}), 201


@api_views.route("/orders/<string:payment_status>")
@role_required(["staff", "manager", "admin"])
def filter_orders(user_role: str, user_id: str, payment_status):
    """Filter ordered base on paid or pending payment."""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    api_path = request.path
    try:
        terminal = session.get("terminal")
        # Get all pending payment from databases
        if payment_status == "pending":
            all_pending_orders = storage.all_get_by(
                Order, is_paid=False, terminal=terminal
            )
            if not all_pending_orders:
                return jsonify([]), 200
            else:
                sorted_pending_orders = sorted(
                    all_pending_orders,
                    key=lambda order : order.updated_at,
                    reverse=True                                                                
                )
                response = [{
                    "order": order.to_dict(),
                    "customer": order.customer.to_dict(),
                    "ordered_by": order.ordered_by.to_dict()
                    } for order in  sorted_pending_orders]
            return jsonify(response), 200
        elif payment_status == "paid":
            # Get paid orders for today
            start_date_obj = end_date_obj = nigeria_today_date()
            orders = storage.get_by_date(
                Order, start_date_obj, end_date_obj,
                "created_at", terminal=terminal
            )

            sorted_orders = sorted(
                orders, key=lambda order : order.updated_at, reverse=True
            )
            if not orders:
                return jsonify([]), 200
            response = [{
                "order": order.to_dict(),
                "customer": order.customer.to_dict(),
                "ordered_by": order.ordered_by.to_dict()
            } for order in sorted_orders if order.is_paid]
        else:
            abort(404)
        return jsonify(response), 200
    except Exception as e:
        print(str(e))
        error = f"{CURRENT_TIME}\t{TODAY_DATE}\t{api_path}\t{str(e)}\n\n"
        write_to_file(ERROR_LOG_FILE, error)
        return jsonify({"error": str(e)}), 500
    finally:
        storage.close()


@api_views.route("/orders/<string:start_date>/<string:end_date>/get")
@role_required(["manager", "admin", "staff"])
def get_order_by_date(
    user_role: str, user_id: str, start_date: str, end_date: str
):
    """Retrieve sales at any interval of time."""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    terminal = session.get("terminal")
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")

    # Retrieve expenditure at an interval of time
    sales = storage.get_by_date(
        Order, start_date_obj, end_date_obj,
        "created_at", terminal=terminal
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
        sale.amount for sale in sorted_sales if sale.terminal == terminal
    )

    response = {
            "orders": [{
                "order": order.to_dict(),
                "customer": order.customer.to_dict(),
                "user": order.ordered_by.to_dict(),
               } for order in sorted_sales if order.terminal == terminal
            ],
            "accumulated_sum": accumulated_sum
    }
    storage.close()
    return jsonify(response), 200


@api_views.route("/order-items", methods=["POST"])
@role_required(["staff", "manager", "admin"])
def order_items(user_role: str, user_id: str):
    """Store order details in database and track stock changes."""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    terminal = session.get("terminal")
    data = request.get_json()
    api_path = request.path

    # Validate request body
    required_fields = ["customerData", "itemOrderData", "orderData"]
    error_response = bad_request(data, required_fields)
    if error_response:
        return jsonify(error_response), 400

    customer_data = data["customerData"]
    item_data = data["itemOrderData"]
    order_data = data["orderData"]

    # Track previous sales data for rollback
    prev_sales = {"food": 0, "drink": 0, "game": 0, "laundry": 0}
    new_order = None
    item_sold = None

    try:
        # Check for possible duplicate order.
        sess = storage.session
        verify_duplicate = data.get("isDuplicateOrder")
        if not verify_duplicate:
            is_duplicate = is_duplicate_order(
                sess, customer_data.get("name"),
                user_id, order_data.get("amount"),
                order_data.get("payment_type"),
                Customer, Order, terminal
            )
            if is_duplicate:
                return jsonify({"error": "Duplicate Order"}), 409
        sess.close()

        user = storage.get_by(User, id=user_id)
        customer = storage.get_by(Customer, id=data.get("customer_id"))

        # Add new or existing customer
        if not customer:
            customer_data.update({
                "created_at": TODAY_DATE,
                "terminal": terminal
            })
            customer = Customer(**customer_data)
            storage.new(customer)
            storage.flush()

        order_data.update({
            "customer_id": customer.id,
            "ordered_by_id": user.id,
            "terminal": terminal
        })

        new_order = Order(**order_data)
        storage.new(new_order)
        storage.flush()

        # Generate receipt
        receipt = create_receipt("order_id", new_order.id)
        storage.new(receipt)

        # Get or create sales entry for today
        item_sold = storage.get_by(Sale, entry_date=TODAY_DATE, terminal=terminal)
        if not item_sold:
            item_sold = Sale(entry_date=TODAY_DATE, terminal=terminal)
            storage.new(item_sold)

        # Store previous sales values
        for key in prev_sales:
            prev_sales[key] = getattr(item_sold, f"{key}_sold", 0) or 0

        # Process each ordered item
        for item in item_data:
            update_item_stock(item, customer, new_order, item_sold, terminal)

        # Commit only if order has items
        if not new_order.order_items:
            return jsonify({"error": "Unable to process your order. Please try again."}), 422

        storage.save()
        return jsonify({"order_id": new_order.id}), 200

    except ValueError as e:
        storage.rollback()
        return jsonify({"error": str(e)}), 422

    except Exception as e:
        print(str(e))
        storage.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        storage.close()


@api_views.route("/orders/<string:order_id>/delete", methods=["DELETE"])
@role_required(["admin"])
def delete_order(user_id: str, user_role: str, order_id: str):
    """Delete customer order."""
    terminal = session.get("terminal")
    order = storage.get_by(OrderItem, id=order_id, terminal=terminal)
    if not order:
        abort(404)

    sale_date = order.created_at.strftime("%Y-%m-%d")
    order_amount = order.amount

    today_sale = storage.get_by(Sale, entry_date=sale_date, terminal=terminal)

    if order.drink_id:
        today_sale.drink_sold -= order_amount
    if order.food_id:
        today_sale.food_sold -= order_amount
    if order.game_id:
        today_sale.game_sold -= order_amount
    if order.laundry_id:
        today_sale.laundry_sold -= order_amount

    # Subtract from grand total order
    total_order = order.order
    total_order.amount -= order_amount

    # Delete order if no order items attach to it.
    if total_order.amount == 0:
        storage.delete(total_order)

    storage.delete(order)
    storage.save()
    storage.close()
    return jsonify({"message": "Order Remove Successfully"}), 201
