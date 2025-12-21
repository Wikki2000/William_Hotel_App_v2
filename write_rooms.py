import json
from models.room import Room
from models import storage
from datetime import datetime

def serialize_datetime(dt):
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)

rooms = []

for room in storage.all(Room).values():
    new_room = {
        "id": str(room.id),
        "number": room.number,
        "terminal": room.terminal,
        "isOccupied": False,
        "cashPrice": room.amount,
    }
    rooms.append(new_room)

# Write to JSON
with open("rooms.json", "w") as f:
    json.dump(rooms, f, indent=4)

print(f"Exported {len(rooms)} rooms to rooms.json")

