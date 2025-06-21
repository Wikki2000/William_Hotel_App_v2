#!/usr/bin/python3
"""Handle API request for Customer module"""
from models.customer import Customer
from models.booking import Booking
from models.room import Room
from models.sale import Sale
from models.order import Order
from flask import abort, jsonify, request, session
from api.v1.views import api_views
from api.v1.views.utils import (
    create_receipt, bad_request, role_required, nigeria_today_date,
    check_reservation, write_to_file, update_room_sold
)
from api.v1.views import constant
from models import storage
from datetime import date, datetime, timedelta
import pytz


ERROR_LOG_FILE = "logs/error.log"

@api_views.route(
    "/guests/<string:customer_id>/rooms/<string:room_id>/extend-stay",
    methods=["POST"]
)
@role_required(["manager", "admin", "staff"])
def extend_guest_stay(user_role: str, user_id: str, room_id, customer_id):
    """Extend guest stay by placing new booking."""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    data = request.get_json()
    api_path = request.path
    terminal = session.get("terminal")

    required_fields = ["duration", "checkin", "checkout", "amount", "is_paid"]
    error_response = bad_request(data, required_fields)
    if error_response:
        abort(400)

    bookings = storage.all_get_by(Booking, room_id=room_id, is_reserve=True)
    room = storage.get_by(Room, id=room_id)
    checkout_date = data.get("checkout")
    checkin_date = data.get("checkin")
    resarvation_error_msg = check_reservation(
        bookings, checkout_date, checkin_date, room.number
    )
    if resarvation_error_msg:
        return jsonify(resarvation_error_msg), 422

    data.update({
        "room_id": room_id, "customer_id": customer_id, "checkin_by_id": user_id,
    })

    book = None
    receipt = None
    try:
        data["terminal"] = terminal
        # Create booking object
        book = Booking(**data)
        storage.new(book)
        storage.save()

        nigeria_time = datetime.now(pytz.timezone('Africa/Lagos'))
        current_hour = nigeria_time.hour                                                                                                                                
        if 0 <= current_hour <= constant.BOOKING_END_BY:
            book.created_at -= timedelta(days=1)

        # Create booking receipt object.
        receipt = create_receipt("booking_id", book.id) 
        storage.new(receipt)

        update_room_sold(data.get("amount"))
        storage.save()
        book = storage.get_by(Booking, id=book.id) 
        return jsonify(book.to_dict()), 200

    except Exception as e:
        storage.delete_many([book, receipt])
        storage.save()
        print(str(e))
        error = f"{CURRENT_TIME}\t{TODAY_DATE}\t{api_path}\t{str(e)}\n\n"
        write_to_file(ERROR_LOG_FILE, error)
        return jsonify({"error": str(e)}), 500

    finally:
        storage.close()


@api_views.route(
    "/guests/<string:customer_id>/<string:booking_id>/<string:status>/service-list"
)
@role_required(["manager", "admin", "staff"])
def customer_service_list(
    user_role: str, user_id: str, booking_id: str,
    customer_id: str, status: str
):
    """Retrieve all services given to a guest."""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    customer = storage.get_by(Customer, id=customer_id)
    if not customer:
        abort(404)

    orders = bookings = None
    # Filter base on payment status
    if status == "all":
        bookings = storage.all_get_by(Booking, customer_id=customer_id, is_use=True)
        #orders = customer.orders
        orders = storage.all_get_by(Order, customer_id=customer_id)
    elif status == "pending":
        bookings = storage.all_get_by(
            Booking, customer_id=customer_id, is_use=True, is_paid="no"
        )
        orders = storage.all_get_by(Order, customer_id=customer_id, is_paid=False)
    elif status == "paid":
        bookings = storage.all_get_by(
            Booking, customer_id=customer_id, is_use=True, is_paid="yes"
        )
        orders = storage.all_get_by(Order, customer_id=customer_id, is_paid=True)

    if not orders and not bookings:
        return jsonify([]), 200

    # Sort list of bookings and orders.
    sorted_bookings = sorted(
        bookings, key=lambda book: book.updated_at, reverse=True
    )
    sorted_orders = sorted(
        orders, key=lambda order: order.updated_at, reverse=True
    )

    total_order_amount = sum(order.amount for order in sorted_orders)
    total_booking_amount = sum(booking.amount for booking in sorted_bookings)

    sorted_orders_list = [order.to_dict() for order in sorted_orders]
    sorted_bookings_list = [booking.to_dict() for booking in sorted_bookings]
    storage.close()

    return jsonify({
        "bookings": sorted_bookings_list,
        "orders": sorted_orders_list,
        "bookings_amount": total_booking_amount,
        "orders_amount": total_order_amount,
    }), 200
