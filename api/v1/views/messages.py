#!/usr/bin/python3
"""Handle API request for messages"""
from models.private_message import PrivateMessage
from models.group_message import GroupMessage
from models.group import Group
from models.user import User
from flask import abort, jsonify, request
from api.v1.views import api_views
from api.v1.views.utils import (
    bad_request, role_required, user_friend_messages
)
from models import storage
from typing import Dict


@api_views.route("/messages/<string:friend_id>/mark-read", methods=["PUT"])
@role_required(["manager", "staff", "admin"])
def mark_as_read(user_id: str, user_role: str, friend_id):
    messages = user_friend_messages(user_id, friend_id)
    if not messages:
        return jsonify([]), 200

    # Update unread message of two users.
    for msg in messages:
        if not msg.is_read and msg.receiver.id == user_id:
            msg.is_read = True
    storage.save()
    storage.close
    return jsonify({"message": "All Message Mark as Read"}), 201


@api_views.route("/messages/<string:group_id>/group")
@role_required(["manager", "staff", "admin"])
def group_messages(user_id: str, user_role: str, group_id: str) -> Dict:
    """Retrieve group messages."""
    group = storage.get_by(Group, id=group_id)
    if not group:
        abort(404)

    group_messages = group.group_messages
    if not group_messages:
        return jsonify([]), 200

    sorted_messages = sorted(
        group_messages, key=lambda group_msg : group_msg.created_at
    )


    return jsonify([{
        "message": msg.to_dict(),
        "user": msg.user.to_dict(),
    } for msg in sorted_messages]), 200
    storage.close()


@api_views.route("/messages/<string:friend_id>/private")
@role_required(["manager", "staff", "admin"])
def private_messages(user_id: str, user_role: str, friend_id: str) -> Dict:
    """
    Retrieve private messages between the logged-in user and the receiver.
    Messages are sorted by timestamp (ascending order).
    """
    sorted_messages = user_friend_messages(user_id, friend_id)

    if not sorted_messages:
        return jsonify([]), 200

    return jsonify([{
            "user": msg.sender.to_dict(),
            "message": msg.to_dict()
        } for msg in sorted_messages]), 200
