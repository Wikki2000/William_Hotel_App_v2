#!/usr/bin/python3
"""Handle API request for Game class"""
from api.v1.views import api_views
from models.error_log import ErrorLog
from flask import abort, jsonify, request, session
from flask_jwt_extended import jwt_required
from models import storage


@api_views.route("/errors/log")
@jwt_required()
def error_logs():
    """Retrieve all error log."""
    try:
        errors = storage.all_get_by(ErrorLog)
        if not errors:
            return jsonify([]), 200
        sorted_errors = sorted(errors, key=lambda error : error.created_at)
        return jsonify([{
            **error.to_dict(),
            "bussiness_name": error.hotel.name
        } for error in sorted_errors]), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": "Internal Error Occured"}), 500
    finally:
        storage.close()



@api_views.route("/errors/<string:error_id>/delete", methods=["DELETE"])
@jwt_required()
def delete_error(error_id: str):
    """Remove error from logs."""
    error = storage.get_by(ErrorLog, id=error_id)

    if not error:
        abort(404)
    storage.delete(error)
    storage.save()
    return jsonify({"message": "Error Remove Successfully"}), 200
