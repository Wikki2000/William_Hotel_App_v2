#!/usr/bin/python3
"""Handle API request for all staff members"""
from models.user import User
from flask import abort, jsonify, request
from api.v1.views import api_views
from api.v1.views.utils import bad_request, role_required, convert_to_binary
from models import storage
from sqlalchemy.exc import IntegrityError


@api_views.route("/members/<string:member_id>")
@role_required(["staff", "admin", "manager"])
def get_user(user_role: str, user_id: str, member_id: str):
    """Retrieved a staff data using his ID
    """
    member = storage.get_by(User, id=member_id)
    if not member:
        abort(404)
    storage.close()
    return jsonify(member.to_dict())


@api_views.route("/user-roster")
@role_required(["staff", "admin", "manager"])
def get_rosters(user_role: str, user_id: str):
    users = storage.all(User).values()
    if not users:
        return jsonify([]), 200

    sorted_users = sorted(users, key=lambda user : int(user.rank_number))
    response = [{
        "name": f"{user.first_name} {user.last_name}",
        "portfolio": user.portfolio,
        "roster": user.roster,
        "role": user.role,
    } for user in sorted_users if user.role != 'admin']
    storage.close()
    return jsonify(response), 200


@api_views.route("/users")
@role_required(["staff", "admin", "manager"])
def get_users(user_role: str, user_id: str):
    users = storage.all(User).values()
    if not users:
        return jsonify([]), 200


    sorted_users = sorted(users, key=lambda user : int(user.rank_number))
    response = [user.to_dict() for user in sorted_users
                if user.role != 'admin']
    storage.close()
    return jsonify(response), 200


@api_views.route("/members/<member_id>/update", methods=["PUT"])
@role_required(["staff", "admin", "manager"])
def update_profile(user_role: str, user_id: str, member_id: str):
    """Update Staff profile
    """
    data = request.get_json()
    try:
        user = storage.get_by(User, id=member_id)
        if not user:
            abort(404)

        # Convert Base64String of profile photo to Binary
        base64_string = data.get("profile_photo")
        data["profile_photo"] = convert_to_binary(base64_string)

        for key, val in data.items():
            if val and key != "id":
                setattr(user, key, val)
        storage.save()
        user = storage.get_by(User, id=member_id)
        return jsonify(user.to_dict()), 201
    except IntegrityError:
        return jsonify({"error": "User Exist's Already"}), 409
    except Exception as e:
        print(str(e))
        return jsonify({"error": "An Error Occured"}), 500
    finally:
        storage.close()


@api_views.route("/users", methods=["POST"])
@role_required(["admin"])
def add_user(user_role: str, user_id: str):
    """Add new user."""
    data = request.get_json()
    try:
        required_fields = ["email", "first_name", "last_name",
                "role", "portfolio"]
        error_response = bad_request(data, required_fields)
        if error_response:
            return jsonify(error_response), 400

        # Add a default password oncce user is created
        data["password"] = "12345" 

        user = User(**data)
        user.hash_password()
        storage.new(user)
        storage.save()
        user = storage.get_by(User, id=user.id) 
        return jsonify(user.to_dict()), 200
    except IntegrityError:
        return jsonify({"error": "User Exist's Already"}), 409
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()


@api_views.route("/members/<member_id>/delete", methods=["DELETE"])
@role_required(["admin"])
def remove_user(user_role: str, user_id: str, member_id: str):
    """Remove user from database."""
    user = storage.get_by(User, id=member_id)
    if not user:
        abort(404)
    storage.delete(user)
    storage.save()
    storage.close()
    return jsonify({"message": "User Deleted Successfully"}), 200


@api_views.route("/users/<string:staff_id>/upsert-roster", methods=["PUT"])
@role_required(["admin", "manager"])
def create_update_roster(user_role: str, user_id: str, staff_id: str):
    """Update or create staff roster"""
    data = request.get_json()
    user = storage.get_by(User, id=staff_id)
    if not user:
        abort(404)
    user.roster = data
    storage.save()
    return jsonify({"message": "Staff Roster Updated Successfully !"}), 200
