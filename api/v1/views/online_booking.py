from flask import request, jsonify, session
import requests
import time
import os
from api.v1.views import api_views, constant
from api.v1.views.utils import (
    bad_request, add_substract_from_date, create_receipt,
    update_room_sold
)
from models import storage
from datetime import datetime
from uuid import uuid4
from models.room import Room
from models.customer import Customer
from models.booking import Booking
import pytz


PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY_TEST')

@api_views.route('/online/booking/initiate-payment', methods=['POST'])
def start_payment():
    """Initialize Payments."""
    data = request.get_json()

    required_fields = ["booking_data", "guest_data"]
    error_response = bad_request(data, required_fields)
    if error_response:
        return jsonify(error_response), 400

    booking_data = data.get("booking_data")
    guest_data = data.get("guest_data")

    room_type = booking_data .get("roomType")
    room_count = booking_data.get("requestedRooms")
    duration = booking_data.get("duration")
    email = guest_data.get("email")

    rooms = storage.get_by(Room, name=room_type)

    if not rooms:
        abort(404)

    room_rate = rooms.amount

    total_amonut = room_rate * duration * room_count * 100
    reference = f"SUBS-{uuid4().hex}"

    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    callback_url = (
        f"{request.host_url.rstrip('/')}" + 
        "/guest/booking/payment-processing" + 
        f"?ref={reference}"
    )

    payload = {
        "email": email,
        "amount": total_amonut,
        "reference": reference,
        "callback_url": callback_url
    }

    try:
        res = requests.post("https://api.paystack.co/transaction/initialize", json=payload, headers=headers)
        paystack_response = res.json()
    except Exception as e:
        print(e)
        return jsonify({"error": "Error connecting to Paystack", "details": str(e)}), 500

    if paystack_response.get('status'):
        session["data"] = {
            "booking_data": booking_data,
            "guest_data": guest_data
        }
        return jsonify({
            "checkout_url": paystack_response['data']['authorization_url']
        })
    else:
        return jsonify({
            "error": "Unable to initiate payment",
            "details": paystack_response.get('message')
        }), 400


@api_views.route('/online/booking/payment-complete', methods=["POST"])
def payment_complete():
    """."""
    data = request.get_json()

    required_fields = ["ref"]
    error_response = bad_request(data, required_fields)
    if error_response:
        return jsonify(error_response), 400

    ref = data.get("ref")

    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"
    }

    data = session.get("data")
    if not data:
        return jsonify({"error": "Session data not set"}), 400

    booking_data = data.get("booking_data")
    guest_data = data.get("guest_data")

    verify_url = f"https://api.paystack.co/transaction/verify/{ref}"
    res = requests.get(verify_url, headers=headers)
    result = res.json()

    if result['status'] and result['data']['status'] == "success":
        room_type = booking_data .get("roomType")
        room_count = booking_data.get("requestedRooms")
        duration = booking_data.get("duration")

        rooms = storage.all_get_by(Room, name=room_type)[:room_count]
        if not rooms:
            abort(404)

        room_rate = rooms[0].amount
        #total_amonut = room_rate * duration * room_count * 100

        customer = Customer(**guest_data)
        storage.new(customer)
        customer.is_guest = True
        storage.flush()

        user_id = "54db7b8f-8336-4c0c-8679-f7328a2663e0"

        booking_id_list = []
        for room in rooms:
            amount = room_rate * duration
            book_attr = {
                "checkin": booking_data["checkin"],
                "checkout": booking_data["checkout"],
                "duration": duration, "is_reserve": True,
                "is_paid": "yes", "is_use": False,
                "customer_id": customer.id, "checkin_by_id": user_id,
                "guest_number": booking_data["guest_number"], "room_id": room.id,
                "amount": amount, "payment_type": "Transfer"
            }

            previous_room_sold = 0
            receipt = sale = book = receipt = None

            book = Booking(**book_attr)
            storage.new(book)
            room.status = "reserved"
            storage.flush()
            booking_id_list.append(book.id)

            nigeria_time = datetime.now(pytz.timezone('Africa/Lagos'))
            current_hour = nigeria_time.hour

            if 0 <= current_hour <= constant.BOOKING_END_BY:
                book.created_at -= timedelta(days=1)

            # Create receipt for every booking.
            receipt = create_receipt("booking_id", book.id)
            storage.new(receipt)
            update_room_sold(amount)

        storage.save()
        storage.close()
        return jsonify({"message": "Reservation Successfully"}), 200

    return "Payment verification failed", 400
