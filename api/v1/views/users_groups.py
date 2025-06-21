#!/usr/bin/python3
"""Handle API request for Food & Drink class"""
from models.group import Group
from models.user import User
from models.private_message import PrivateMessage
from flask import abort, jsonify, request
from api.v1.views import api_views
from api.v1.views.utils import bad_request, role_required
from models import storage
from typing import Dict

def count_unread_msg(user_id: str, friend_id: str) -> int:
    """
    Count friend message read by Logged in user.

    :user_id - The current Loggeed-in user.
    :friend_id - The colleague/friend of Logged user.
    :rtype - The number of colleague message read by user.
    """
    return storage.count_by(
        PrivateMessage, is_read=False, receiver_id=user_id, sender_id=friend_id
    )


@api_views.route("/users/groups")
@role_required(["manager", "staff", "admin"])
def get_groups_users(user_id: str, user_role: str) -> Dict:
    """Retrieve users and groups in databases."""
    try:
        groups = storage.all(Group).values()
        users = storage.all(User).values()

        sorted_groups = sorted(groups, key=lambda group : group.name)

        groups_response = [group.to_dict() for group in sorted_groups]
        users_response = [{
            **user.to_dict(),
            "count_unread_messages": count_unread_msg(user_id, user.id)
            } for user in users if user.id != user_id]

        return jsonify({
            "users": users_response, 
            "groups": groups_response
        }), 200
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()
