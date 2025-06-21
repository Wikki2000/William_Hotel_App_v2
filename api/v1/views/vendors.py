#!/usr/bin/python3
"""Handle API request for vendor module"""
from models.vendor import Vendor
from flask import abort, jsonify, request
from api.v1.views import api_views
from api.v1.views.utils import role_required, bad_request
from models import storage
from sqlalchemy.exc import IntegrityError
from datetime import datetime


@api_views.route("/vendors", methods=["POST"])
@role_required(["manager", "admin"])
def add_vendor(user_role: str, user_id: str):
    """Add new vendor"""
    data = request.get_json()

    required_fields = ["name", "portfolio", "number"]
    error_response = bad_request(data, required_fields)
    if error_response:
        return jsonify(error_response), 400

    try:
        vendor = Vendor(**data)
        storage.new(vendor)
        storage.save()
        vendor = storage.get_by(Vendor, id=vendor.id)
        return jsonify(vendor.to_dict()), 200
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()


@api_views.route("/vendors/<vendor_id>/edit", methods=["PUT"])
@role_required(["admin", "manager"])
def update_vendor(user_role: str, user_id: str, vendor_id: str):
    """Update data of a vendor by it ID
    """
    data = request.get_json()
    try:
        vendor = storage.get_by(Vendor, id=vendor_id)
        if not vendor:
            abort(404)

        for key, val in data.items():
            if val and hasattr(vendor, key):
                setattr(vendor, key, val)
        vendor.updated_at = datetime.utcnow()
        storage.save()
        vendor = storage.get_by(Vendor, id=vendor_id)
        return jsonify(vendor.to_dict()), 201
    except Exception as e:
        print(str(e))
        return jsonify({"error": "An Error Occured"}), 500
    finally:
        storage.close()


@api_views.route("/vendors/<vendor_id>/delete", methods=["DELETE"])
@role_required(["manager", "admin"])
def delete_vendor(user_role: str, user_id: str, vendor_id: str):
    """Delete vendor by it ID's."""
    try:
        vendor = storage.get_by(Vendor, id=vendor_id)
        if not vendor:
            abort(404)
        storage.delete(vendor)
        storage.save()
        return jsonify({"name": vendor.name}), 200
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()


@api_views.route("/vendors")
@role_required(["staff", "manager", "admin"])
def get_vendors(user_role: str, user_id: str):
    """Retrieved all vendors"""
    vendors = storage.all(Vendor).values()
    sorted_vendors = sorted(vendors, key=lambda vendor : vendor.name)
    if not sorted_vendors:
        return jsonify([]), 200

    return jsonify([vendor.to_dict() for vendor in sorted_vendors]), 200
    storage.close()
    return jsonify(response), 200


@api_views.route("/vendors/<vendor_id>/get")
@role_required(["staff", "manager", "admin"])
def get_vendor(user_role: str, user_id: str, vendor_id: str):
    """Get a vendor by it ID's"""
    vendor = storage.get_by(Vendor, id=vendor_id)
    if not vendor:
        abort(404)
    storage.close()
    return jsonify(vendor.to_dict()), 200
