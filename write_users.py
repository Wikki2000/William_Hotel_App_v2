import json
from models.user import User
from models import storage
from datetime import datetime

def serialize_datetime(dt):
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)

users = []

for user in storage.all(User).values():
    new_user = {
        "id": str(user.id),
        "createdAt": serialize_datetime(user.created_at) if hasattr(user, 'created_at') else None,
        "updatedAt": serialize_datetime(user.updated_at) if hasattr(user, 'updated_at') else None,
        "firstName": user.first_name,
        "middleName": user.middle_name,
        "lastName": user.last_name,
        "userName": getattr(user, 'username', None),
        "email": user.email,
        "address": user.address,
        "state": user.state,
        "nationality": "Nigeria",  # hardcoded
        "phone": user.number,
        "password": "12345",
        "performance": user.performance,
        "role": user.role,
        "salary": user.salary,
        "portfolio": user.portfolio,
        "isActive": user.is_active,
        "isDelete": user.is_delete,
        "isActivate": True,  # default
        "forceReset": True,  # default
        "startDate": serialize_datetime(user.start_date),
        "dob": serialize_datetime(user.dob),
        "bank": None,
        "accountNo": None,
        "nokName": user.nok,
        "nokPhone": user.nok_number,
        "nokAddress": None,
        "nokEmail": None,
        "nokRelation": None,
        "gender": user.gender
    }
    users.append(new_user)

# Write to JSON
with open("users.json", "w") as f:
    json.dump(users, f, indent=4)

print(f"Exported {len(users)} users to users.json")

