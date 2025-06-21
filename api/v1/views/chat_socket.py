#!/usr/bin/python3
"""Handle API views for message."""
from api.v1.views import api_views
from flask import abort, jsonify, request
from flasgger.utils import swag_from
from flask_socketio import SocketIO, emit, join_room
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models.private_message import PrivateMessage
from models.group_message import GroupMessage
from models.group import Group
from models import storage
from typing import Any, Dict

# Create a SocketIO instance
socketio = SocketIO()


@socketio.on("group_message")
def group_msg(data: Dict[str, str]):
    """Event handler for sending a message."""
    verify_jwt_in_request()
    user_id = get_jwt_identity()

    # Save the message to the database
    msg: GroupMessage = GroupMessage(
        group_id=data.get("chat_id"),
        user_id=user_id,
        text=data.get("message")
    )
    storage.new(msg)
    storage.save()

    user_dict = msg.user.to_dict()
    room = data.get('chat_id')
    response = {
        "message": msg.text,
        "username": user_dict.get("username"),
        "user_id": user_dict.get("id"),
        "user_photo": user_dict.get("profile_photo")
    }
    storage.close()

    # Emit the message back to both sender and receiver
    emit('received_group_message', response, room=room)


@socketio.on("private_message")
def private_msg(data: Dict[str, str]):
    """Event handler for sending a private message."""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()

        # Save message to the database
        msg = PrivateMessage(
            sender_id=user_id,
            receiver_id=data.get("chat_id"),
            text=data.get("message")
        )
        storage.new(msg)
        storage.save()

        sender_dict = msg.sender.to_dict()
        receiver_dict = msg.receiver.to_dict()
        response = {
            "message": msg.text,
            "sender_name": sender_dict.get("username"),
            "receiver_name": receiver_dict.get("username"),
            "user_id": sender_dict.get("id"),
            "user_photo": sender_dict.get("profile_photo")
        }

        room = private_room(data.get('chat_id'), user_id)
        emit('received_private_message', response, room=room)
    except Exception as e:
        print("Error in private_msg:", str(e))


@socketio.on("join_group_chat")
def join_group_chat(data: Dict[str, str]):
    """Join room for group chat."""
    # Manually apply jwt_required() logic for WebSockets
    verify_jwt_in_request()

    user_id = get_jwt_identity()
    join_room(data.get('chat_id'))
    emit('success', {'message': 'Joined chat room'}, room=data.get('chat_id'))


@socketio.on("join_private_chat")
def join_private_chat(data: Dict[str, str]):
    """Join room for private chat."""
    # Manually apply jwt_required() logic for WebSockets
    verify_jwt_in_request()

    user_id = get_jwt_identity()
    room = private_room(user_id, data.get('chat_id'))
    join_room(room)
    emit('success', {'message': 'Joined chat room'}, room=data.get('chat_id'))


def private_room(user_id_1: str, user_id_2: str) -> str:
    """
    Create a consistent room name based on the two user IDs,
    irrespective of their order.
    """
    if not user_id_1 or not user_id_2:
        raise ValueError("Both user IDs must be valid.")
    room = f"chat_{min(user_id_1, user_id_2)}_{max(user_id_1, user_id_2)}"
    return room
