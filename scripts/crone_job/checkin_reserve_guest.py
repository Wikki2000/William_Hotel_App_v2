#!/usr/bin/python3


from models import storage
from models.booking import Booking
from models.room import Room
from datetime import datetime
from api.v1.views.utils import write_to_file, nigeria_today_date


LOG_FILE = "logs/automated_check_in.log"


TODAY_DATE = nigeria_today_date()
reservations = storage.all_get_by(Booking, is_reserve=True, is_use=False)
for reservation in reservations:
    if reservation.checkin.strftime("%Y-%m-%d") <=  TODAY_DATE.strftime("%Y-%m-%d") <= reservation.checkout.strftime("%Y-%m-%d"):
        reservation.is_reserve = False
        reservation.is_use = True
        reservation.updated_at = TODAY_DATE

        reservation.room.status = "occupied"
        storage.save()

        msg = f"Reserve Guest for Room {reservation.room.number} checkin successfully on {date.now()}\n\n"
        write_to_file(LOG_FILE, msg)

msg = "Testing Crontab"
write_to_file(LOG_FILE, msg)
