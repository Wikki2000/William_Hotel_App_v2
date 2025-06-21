#!/usr/bin/python3
"""Handle API request for maintenance module"""
from models.maintenance import Maintenance
from models.room import Room
from models.user import User
from flask import abort, jsonify, request
from api.v1.views import api_views
from api.v1.views.utils import role_required, bad_request, convert_to_binary
from models import storage
from sqlalchemy.exc import IntegrityError


@api_views.route("/maintenances", methods=["POST"])
@role_required(["staff", "manager", "admin"])
def add_maintenance(user_role: str, user_id: str):
    """Add new room maintenance"""
    data = request.get_json()

    required_fields = ["fault", "faultLocation"]
    error_response = bad_request(data, required_fields)
    if error_response:
        return jsonify(error_response), 400

    if len(storage.all(Maintenance)) >= 5:
        msg = (
        "Number of maintainence exceeded 5 maximum," + 
        "Please delete to create space."
        )
        return jsonify({"error": msg}), 422

    user = storage.get_by(User, id=user_id)
    if not user:
        abort(404)

    # Convert image to binary if given
    if data.get("image"):
        data["image"] = convert_to_binary(data.get("image"))

    maintenance_attr = {
        "fault": data.get("fault"),
        "location": data.get("faultLocation"),
        "description": data.get("description"),
        "image": data.get("image"), "user_id": user_id
    }

    try:
        maintenance = Maintenance(**maintenance_attr)
        storage.new(maintenance)
        storage.save()
        maintenance = storage.get_by(Maintenance, id=maintenance.id)
        return jsonify(maintenance.to_dict()), 200
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()


@api_views.route("/maintenances/<maintenance_id>/delete", methods=["DELETE"])
@role_required(["manager", "admin", "staff"])
def delete_maintenance(user_role: str, user_id: str, maintenance_id: str):
    """Delete maintenance by it ID's."""
    try:
        maintenance = storage.get_by(Maintenance, id=maintenance_id)
        if not maintenance:
            abort(404)
        storage.delete(maintenance)
        storage.save()
        return jsonify({"message": "Deleted Successfully"}), 200
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()


@api_views.route("/maintenances/<string:maintenance_id>/get")
@role_required(["manager", "admin", "staff"])
def get_by_id(user_role: str, user_id: str, maintenance_id: str):
    """Get maintenance by it's ID's."""
    try: 
        maintenance = storage.get_by(Maintenance, id=maintenance_id) 
        if not maintenance:
            abort(404) 

        full_name = (
            maintenance.user.first_name + " " + maintenance.user.last_name
        )
        return jsonify({
            **maintenance.to_dict(),
            "reported_by": full_name
        }), 200
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()


@api_views.route("/maintenances")
@role_required(["staff", "manager", "admin"])
def get_maintenances(user_role: str, user_id: str):
    """Retrieved all maintenances"""
    maintenances = storage.all(Maintenance).values()
    sorted_maintenance = sorted(
        maintenances,
        key=lambda maintenance : maintenance.updated_at, reverse=True
    )
    if not maintenances:
        return jsonify([]), 200

    response = [{
        **maintenance.to_dict(),

    } for maintenance in sorted_maintenance]

    storage.close()
    return jsonify(response), 200


@api_views.route(
    "/maintenances/<string:maintenance_id>/<string:status>/status",
    methods=["PUT"]
)
@role_required(["manager", "admin"])
def maintenance_status(
        user_role: str, user_id: str, maintenance_id: str, status: str
):
    """Change Status of maintenances"""
    maintenance = storage.get_by(Maintenance, id=maintenance_id)
    if not maintenance:
        abort(404)
    maintenance_status = None
    if status == "fixed":
        maintenance_status = True
    elif status == "pending":
        maintenance_status = False
    else:
        abort(404)
    maintenance.status = maintenance_status
    storage.save()
    storage.close()
    return jsonify({"message": "Maintenance Status Updated Successfully"}), 200
