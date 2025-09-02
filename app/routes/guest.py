#!/usr/bin/python3
""" Model for handling views for guest dashboard. """
from app.routes import app_guests
from flask import abort, render_template, request
from app.routes.utils import (
    cache_burst_versioning, get_service
)


def get_unique_rooms_by_name(rooms):
    seen_names = set()
    unique_rooms = []

    for room in rooms:
        name = room.get("name").lower()
        if name not in seen_names:
            unique_rooms.append(room)
            seen_names.add(name)

    return unique_rooms


DIRECTORY = "guest"
@app_guests.route("/")
def guest_dashbord():
    """"Render template for guest portal."""
    return render_template(
        f"{DIRECTORY}/dashboard.html",
    )


@app_guests.route('/<category>')
def guest_category(category):
    """"Render template for guest portal."""
    data_map = {
        "foods": {
            "icon": "🍽️ ",
            "title": "Food Menu",
            "items": get_service
        },
        "drinks": {
            "icon": "🍹 ",
            "title": "Drinks Menu",
            "items": get_service
        },
        "rooms": {
            "icon": "🛏️",
            "title": "Rooms Menu",
            "items": get_service
        },
        "games": {
            "icon": "🎮",
            "title" :"Games Menu",
            "items": get_service
        },
        "laundry": {
            "icon": "🧺",
            "title": "Laundry Menu",
            "items": get_service
        },
    }

    if category not in data_map:
        abort(404)

    items = data_map[category]["items"](category)
    items = items

    if category == "rooms":
        items = get_unique_rooms_by_name(items)

    return render_template(
        f"{DIRECTORY}/service_category.html",
        title=data_map[category]["title"],
        icon=data_map[category]["icon"],
        items=items, category=category,
    )


@app_guests.route('/rooms/<room_type>/check-availability')
def check_availability(room_type):
    """Handles room availability check and redirects if available."""
    if room_type.lower() not in ["standard", "deluxe"]:
        abort(404)

    rooms = get_service("rooms")
    unique_rooms = get_unique_rooms_by_name(rooms)
    rooms_data = [{
        "name": room["name"].lower(),
        "amount": room["amount"]
    } for room in unique_rooms]
    return render_template(
        f"{DIRECTORY}/room_availability.html",
        cache_id=cache_burst_versioning(),
        selected_room=room_type.lower(),
        rooms=rooms_data
    )


@app_guests.route('/rooms/confirm-booking')
def confirm_booking():
    return render_template(f"{DIRECTORY}/confirm_booking.html")


@app_guests.route('/booking/payment-processing')
def payment_complete():
    """ Animate while proccessing transaction. """
    return render_template(f"{DIRECTORY}/proccessing_transaction.html")


@app_guests.route("/booking/payment-success")
def payment_success():
    return render_template(
        f"{DIRECTORY}/success_payment.html"
    )
