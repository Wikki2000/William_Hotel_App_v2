#!/usr/bin/python3
"""
Handle API request for booking multiple rooms,
and printing multiple booking receipt.
"""
from models.booking import Booking
from models.customer import Customer
from models.room import Room
from models.user import User
from models.sale import Sale
from flask import abort, jsonify, request, session
from api.v1.views import api_views
from api.v1.views.utils import (
    bad_request, role_required, create_receipt,
    nigeria_today_date, write_to_file, check_reservation,
    update_room_sold
)
from api.v1.views import constant
from models import storage
from sqlalchemy.exc import IntegrityError
from datetime import datetime, date, timedelta
from models.receipt import Receipt
import pytz
import json


ERROR_LOG_FILE = "logs/error.log"


@api_views.route("/bookings/<string:booking_id>/multiple-bookings-details")
@role_required(["staff", "manager", "admin"])
def booking_data_by_ids(user_id: str, user_role: str, booking_id: str):
    """Fetch booking data of a given lists of IDS"""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    api_path = request.path
    terminal = session.get("terminal")
    try:
        bookings = []
        booking_ids_list = json.loads(booking_id)

        for booking_id in booking_ids_list:
            bookings.append(
                storage.get_by(Booking, id=booking_id, terminal=terminal)
            )

        return jsonify({"booking": [{
                **book.to_dict(),
                "book_receipt": book.receipt.receipt_no,
                "room_number": book.room.number if book.room else "xxx",
                "room_name": book.room.name if book.room else "Deleted Room",
                } for book in sorted(bookings, key=lambda book: book.room.number)],
            "customer": bookings[0].customer.to_dict() if bookings[0].customer else None,
            "user": bookings[0].checkin_by.to_dict() if bookings[0].checkin_by else None
        }), 200
    except Exception as e:
        print(str(e))
        error = f"{CURRENT_TIME}\t{TODAY_DATE}\t{api_path}\t{str(e)}\n\n"
        write_to_file(ERROR_LOG_FILE, error)
        return jsonify({"error": str(e)}), 500
    finally:
        storage.close()
