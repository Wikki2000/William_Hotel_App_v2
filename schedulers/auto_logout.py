from datetime import datetime
from models import storage
from models.user import User  # Adjust as needed

def auto_logout_inactive_users():
    """Auto-logout all active users every 12 hours."""
    print(f"[{datetime.now()}] Running auto-logout task...")

    users = storage.all(User)
    for user in users.values():
        if user.is_active:
            user.is_active = False
    storage.save()
    print("Auto-logout completed.")
