#!/usr/bin/python3
"""Handle API request for Customer module"""
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
import traceback


ERROR_LOG_FILE = "logs/error.log"


@api_views.route(
    "/bookings/<string:booking_id>/update-reservation-status", methods=["PUT"]
)
@role_required(["staff", "manager", "admin"])
def update_booking_status(user_id: str, user_role: str, booking_id: str):
    """Fetch booking data of a particular room"""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    api_path = request.path
    book = None
    room_status =""
    try:
        book = storage.get_by(Booking, id=booking_id)
        if not book:
            abort(404)

        checkin_date = book.checkin 
        checkout_date = book.checkout
        room_status = book.room.status
        if room_status == "occupied":
            msg = (
                f"Room {book.room.number} currently occupied. " +
                "Please check out existing guest"
            )
            return jsonify({"error": msg}), 422

        if checkin_date <= TODAY_DATE <= checkout_date:
            book.is_reserve = False 
            book.is_use = True
            book.updated_at = TODAY_DATE 

            book.room.status = "occupied"
            storage.save()
            return jsonify({"msg": "Booking Status Update Successfully"}), 200
        """
        else:
            msg = (
                "Guest can only be check-in during reservation duration " +
                f"within {checkin_date} to {checkout_date}. Please contact " +
                "management for change of date"
            )
            return jsonify({"error": msg}), 422
        """
        
    except Exception as e:
        book.is_reserve = True
        book.is_use = False
        book.room.status = room_status

        print(str(e))                                                               
        error = f"{CURRENT_TIME}\t{TODAY_DATE}\t{api_path}\t{str(e)}\n\n"
        write_to_file(ERROR_LOG_FILE, error)
        return jsonify({"error": str(e)}), 500
    finally:
        storage.close()


@api_views.route("/bookings")
@role_required(["staff", "manager", "admin"])
def bookings(user_id: str, user_role: str):
    """Fetch booking data"""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    api_path = request.path
    terminal = session.get("terminal");
    try:
        start_date_obj = end_date_obj = TODAY_DATE
        search_string = request.args.get('search_string');

        books = []

        if not search_string:
            books = storage.get_by_date(
                Booking, start_date_obj, end_date_obj, "created_at",
            )
        else:
            if search_string == "active_bookings":
                books = storage.all_get_by(Booking, is_use=True, terminal=terminal)
            elif search_string == "reserve_bookings":
                books = storage.all_get_by(Booking, is_reserve=True, terminal=terminal)
            else:
                guests = storage.get_start_with(
                    Customer, "name", search_string, terminal
                )
                for guest in guests:
                    booking = storage.get_by(Booking, customer_id=guest.id)
                    if booking: books.append(booking)
            
        if not books:
            return jsonify([]), 200

        sorted_books = sorted(books, key=lambda book : book.customer.name)

        response = [{
            "booking": booking.to_dict(),
            "guest": booking.customer.to_dict(),
            "checkin_by": booking.checkin_by.to_dict(),
            "room": booking.room.to_dict(),
            "checkout_by": (
                None if not booking.checkout_by
                else booking.checkout_by.to_dict()
            )} for booking in sorted_books if booking.terminal == terminal]
        return jsonify(response), 200
    except Exception as e:
        error = f"{CURRENT_TIME}\t{TODAY_DATE}\t{api_path}\t{str(e)}\n\n"
        write_to_file(ERROR_LOG_FILE, error)
        print(str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        storage.close()


@api_views.route("/bookings/<string:start_date>/<string:end_date>/get")
@role_required(["manager", "admin", "staff"])
def get_bookings_by_date(
    user_role: str, user_id: str, start_date: str, end_date: str
):
    """Retrieve bookings at any interval of time."""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
    terminal = session.get("terminal")

    # Retrieve expenditure at an interval of time
    bookings = storage.get_by_date(
        Booking, start_date_obj, end_date_obj, "created_at",
        terminal=terminal
    )

    # Handle case were there is no expenditure
    if not bookings:
        return jsonify([]), 200


    sorted_bookings = sorted(
        bookings,
        key=lambda booking : booking.updated_at,
        reverse=True
    )

    accumulated_sum = sum(booking.amount for booking in sorted_bookings)
    response = {
        "bookings": [{
            "booking": booking.to_dict(),
            "guest": booking.customer.to_dict(),
            "checkin_by": booking.checkin_by.to_dict(),
            "room": booking.room.to_dict(),
            "checkout_by": (
                None if not booking.checkout_by
                else booking.checkout_by.to_dict()
            )} for booking in sorted_bookings
        ],
        "accumulated_sum": accumulated_sum
    }
    storage.close()
    return jsonify(response), 200


@api_views.route("/bookings/<string:booking_id>/booking-details")
@role_required(["staff", "manager", "admin"])
def booking_data_by_id(user_id: str, user_role: str, booking_id: str):
    """Fetch booking data of a particular room"""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    api_path = request.path
    try:
        book = storage.get_by(Booking, id=booking_id)
        if not book:
            abort(404)

        if not book:
            return jsonify({
                "room": book.room.to_dict(), "booking": None,
                "checkin_by": None, "checkout_by": None
            }), 200

        # Check if room has been checkout by staff
        checkout_by_dict = (
            None if not book.checkout_by
            else book.checkout_by.to_dict()
        )

        return jsonify({
            "booking": {
                **book.to_dict(),
                "book_receipt": book.receipt.receipt_no
            },
            "room": book.room.to_dict(),
            "customer": book.customer.to_dict(),
            "checkin_by": book.checkin_by.to_dict(),
            "checkout_by": checkout_by_dict
        }), 200
    except Exception as e:
        print(str(e))
        error = f"{CURRENT_TIME}\t{TODAY_DATE}\t{api_path}\t{str(e)}\n\n"
        write_to_file(ERROR_LOG_FILE, error)
        return jsonify({"error": str(e)}), 500
    finally:
        storage.close()


@api_views.route("/bookings/<booking_id>/clear_bill", methods=["PUT"])
@role_required(["staff", "manager", "admin"])
def clear_booking_bill(user_id: str, user_role: str, booking_id: str):
    """Clear guest room booking bill."""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    booking = storage.get_by(Booking, id=booking_id)
    if not booking:
        abort(404)

    booking.is_paid = "yes"
    booking.updated_at = TODAY_DATE
    #booking.is_use = False

    # Ensure that a staff clear bill only onced
    if not booking.checkout_by_id:
        booking.checkout_by_id = user_id
        storage.save()
        storage.close()
        return jsonify({"message": "Bill Clear Successfully"}), 201
    else:
        name = (
            "You" if user_id == booking.checkout_by_id
            else f"{booking.checkout_by.first_name} {booking.checkout_by.last_name}"
        )
        storage.rollback()
        storage.close()
        return jsonify({"error": f"Bill Already Cleared by {name} !"}), 409


@api_views.route("/bookings/<booking_id>/edit", methods=["PUT"])
@role_required(["staff", "manager", "admin"])
def update_booking_data(user_id: str, user_role: str, booking_id: str):
    """Update guest data use in booking and payment method used"""
    try:
        TODAY_DATE = nigeria_today_date()
        data = request.get_json()
        required_fields = ["customer", "booking", "room"]
        error_response = bad_request(data, required_fields)
        terminal = session.get("terminal")
        if error_response:
            return jsonify(error_response), 400

        booking_data = data.get("booking") 
        customer_data = data.get("customer")
        room_data = data.get("room")

        new_room = storage.get_by(
            Room, 
            number=room_data.get("new_room"),
            terminal=terminal
        )
        old_room = storage.get_by(
            Room,
            number=room_data.get("old_room"),
            terminal=terminal
        )

        booking = storage.get_by(Booking, id=booking_id)
        if not booking:
            abort(404)

        if not booking.is_use and not booking.is_reserve:
            msg = (
                "You only edit data for reserved guest " +
                "or guest currently lodging"
            )
            return jsonify({"error": f"{msg}"}), 422

        room_status = ""
        if booking.is_use:
            room_status = "occupied"
        elif booking.is_reserve:
            room_status = "reserved"

        new_room_reservation = storage.all_get_by(
            Booking, room_id=new_room.id, is_reserve=True
        )
        reservation_error = check_reservation(
            new_room_reservation, booking_data.get("checkout"),
            booking_data.get("checkin"), new_room.number
        )
        if reservation_error and new_room.number != old_room.number:
            return jsonify(reservation_error), 422

        customer = booking.customer 
        bookings = []
        if booking.is_use:
            bookings = storage.all_get_by(   
                Booking, room_id=old_room.id, customer_id=customer.id, is_use=True
            )
        elif booking.is_reserve:
            bookings = storage.all_get_by(
                Booking, room_id=old_room.id,
                customer_id=customer.id, is_reserve=True
            )

        # Move all bookings to new room & update sales status.
        if new_room.number != old_room.number:
            for booking in bookings:
                # Update all bookings of guest to new room.
                setattr(booking, "room_id", new_room.id)
        
            # Update room status.
            setattr(new_room, "status", room_status)
            setattr(old_room, "status", "available")

        # Skip update VAT/CAT and sales for updating,
        # Payment method use only.
        if booking_data.get("amount"):
            sale_date = booking.created_at.strftime("%Y-%m-%d")
            update_room_sold(terminal, booking_data.get("amount"), booking.amount, sale_date, True)

        # Update booking data of current selected booking.
        for key, val in booking_data.items():
            setattr(booking, key, val)
        booking.checkin_by_id = user_id  # Update with staff that made changes
        booking.updated_at = TODAY_DATE

        # Update customer data of current selected booking.
        for key, val in customer_data.items():
            setattr(customer, key, val)
        customer.updated_at = TODAY_DATE
        
        storage.save()
        return jsonify({"message": "Booking Data Updated Successfully"}), 201

    except Exception as e:
        print(str(e))
        traceback.print_exc() 
        return jsonify({"error": str(e)}), 500
    finally:
        storage.close()


@api_views.route("/book", methods=["POST"])
@role_required(["staff", "manager", "admin"])
def book_room(user_id: str, user_role: str):
    """Book a room"""
    TODAY_DATE = nigeria_today_date()
    CURRENT_TIME = time = datetime.now().strftime("%I:%M %p")
    data = request.get_json()
    api_path = request.path
    terminal = session.get("terminal")

    # Handle Bad Request error
    if not data:
        return jsonify({"error": "Bad Request"}), 400

    user = storage.get_by(User, id=user_id)
    #room = storage.get_by(Room, number=room_number)
    if not user:
        abort(404)

    customer_data = data.get("customer")
    booking_data = data.get("book")
    room_numbers = data.get("room_number")

    # Check that same room is not reserved same time
    checkin_date = booking_data.get("checkin")
    checkout_date = booking_data.get("checkout")

    book = None
    booking_id_list = []

    for room_data in room_numbers:
        room = storage.get_by(
            Room, number=room_data.get("room_number"), terminal=terminal
        )
        bookings = storage.all_get_by(
            Booking, room_id=room.id, is_reserve=True, terminal=terminal
        )

        resarvation_error_msg = check_reservation(
            bookings, checkout_date, checkin_date, room.number
        )
        if resarvation_error_msg:
            return jsonify(resarvation_error_msg), 422

        reserve_status = booking_data.get("is_reserve")
        is_use = True if not reserve_status else False

        # Ensure that can't book room already in use
        if room.status == "occupied" and not reserve_status:
            return jsonify({"error": f"Room {room.number} is occupied"}), 409

        customer_data["terminal"] = terminal
        customer = Customer(**customer_data)
        storage.new(customer)
        customer.is_guest = True
        storage.save()

        book_attr = {
            "checkin": checkin_date, "checkout": checkout_date,
            "duration": booking_data.get("duration"), "is_reserve": reserve_status,
            "is_paid": booking_data.get("is_paid"), "is_use": is_use,
            "customer_id": customer.id, "checkin_by_id": user.id,
            "guest_number": booking_data.get("guest_number"),
            "room_id": room.id, "amount": room_data.get("room_amount"),
            "is_short_rest": booking_data.get("is_short_rest"),
            "is_early_checkin": booking_data.get("is_early_checkin"),
            "payment_type": booking_data.get("payment_type"),
            "terminal": terminal
        }

        previous_room_sold = 0
        receipt = sale = book = receipt = None

        try:
            if not reserve_status:
                room.status = "occupied"   # Cheange room status once book
            book = Booking(**book_attr)
            storage.new(book)
            storage.flush()
            booking_id_list.append(book.id)

            nigeria_time = datetime.now(pytz.timezone('Africa/Lagos'))
            current_hour = nigeria_time.hour

            if 0 <= current_hour <= constant.BOOKING_END_BY:
                book.created_at -= timedelta(days=1)

            # Create receipt for every booking.
            receipt = create_receipt("booking_id", book.id)
            storage.new(receipt)
            update_room_sold(terminal, room_data.get("room_amount"))
            storage.save()

        except Exception as e:
            """
            storage.delete_many([customer, book, receipt])

            if sale:
                if sale.room_sold:
                    setattr(sale, "room_sold", previous_room_sold)

            if room:
                room.status = "available"

            #storage.save()
            print(str(e))
            error = f"{CURRENT_TIME}\t{TODAY_DATE}\t{api_path}\t{str(e)}\n\n"
            write_to_file(ERROR_LOG_FILE, error)
            #return jsonify({"error": str(e)}), 500
            """
            print(traceback.format_exc())

    return jsonify({
        "booking_id": book.id,
        "booking_id_list": booking_id_list,
        "is_reserve": book.is_reserve
    }), 200
    storage.close()


@api_views.route("/bookings/<string:booking_id>/delete", methods=["DELETE"])
@role_required(["staff", "manager", "admin"])
def cancel_reservation(user_id: str, user_role: str, booking_id: str):
    """Cancel/Delete Reservation."""
    terminal = session.get("terminal");
    booking = storage.get_by(Booking, id=booking_id)
    if not booking:
        abort(404)

    sale_date = booking.created_at.strftime("%Y-%m-%d")
    update_room_sold(terminal, new_amount=0, old_amount=booking.amount, date=sale_date, isEdit=True)

    booking.room.status = "available"

    storage.delete(booking)
    storage.save()
    storage.close() 
    return jsonify({"message": "Booking Remove Successfully"}), 201
