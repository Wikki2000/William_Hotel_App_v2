#!/usr/bin/python3
"""Handle API request for leave request"""
from models.leave_request import LeaveRequest
from models.user import User
from flask import abort, jsonify, request
from api.v1.views import api_views
from api.v1.views.utils import (
    send_mail, role_required, read_html_file, bad_request
)
from models import storage


@api_views.route("/request-leave", methods=["POST"])
@role_required(["staff", "manager", "admin"])
def leave_request(user_role: str, user_id: str):
    """Request for leave"""
    data = request.get_json()

    required_fields = ["leave_type", "start_date", "end_date", "description", "staff_name"]
    error_response = bad_request(data, required_fields)
    if error_response:
        print(error_response)
        return jsonify(error_response), 400

    data["staff_id"] = user_id  # Add staff ID to data
    staff_name = data.get("staff_name")

    try:
        del data["staff_name"]
        req = LeaveRequest(**data)
        storage.new(req)

        manager = storage.get_by(User, role="manager")                     
        admin = storage.get_by(User, role="admin")
        manager_name = manager.last_name + " " + manager.first_name       
        manager_email = manager.email

        admin_name = admin.last_name + " " + admin.first_name         
        admin_mail = admin.email

        # Read email from file and interpolate with staff data       
        place_holder = {         
            "staff_name": staff_name, 
            "leave_type": data.get("leave_type"),
            "start_date": data.get("start_date"),
            "end_date": data.get("end_date"),
            "description": data.get("description")
        }

        email_file = "app/templates/email_notification/leave_notify_management.html"          
        subject = "[William's Court Hotel] Leave Request Notification"        
        email_content = read_html_file(email_file, place_holder)

        manager_recipient = {"name": manager_name, "email": manager_email}       
        admin_recipient = {"name": admin_name, "email": admin_mail}

        send_mail(email_content, manager_recipient, subject)       
        send_mail(email_content, admin_recipient, subject)
        storage.save()
        return jsonify({"message": "Loan Request Sent"}), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": "An Internal Error Occured"}), 500
    finally:
        storage.close()


@api_views.route("/members/<string:member_id>/leaves")
@role_required(["staff", "manager", "admin"])
def get_leaves(user_role: str, user_id: str, member_id: str):
    """Retrieve leave request of a user from db."""
    try:
        user = storage.get_by(User, id=member_id)
        if not user:
            abort(404)

        sorted_leaves = sorted(
            user.leaves, key=lambda leave: leave.updated_at, reverse=True
        )
        return jsonify([{
            **leave.to_dict(),
            "first_name": user.first_name,
            "last_name": user.last_name
        } for leave in sorted_leaves]), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": "An Internal Error Occored"}), 500
    finally:
        storage.close()


@api_views.route("/leaves")
@role_required(["staff", "manager", "admin"])
def all_leaves(user_role: str, user_id: str):
    """Retrieves all leaves from database."""
    try:
        leaves = storage.all(LeaveRequest).values()
        if not leaves:
            return jsonify([]), 200
        sorted_leaves = sorted(leaves, key=lambda leave: leave.updated_at)
        return jsonify([{
            **leave.to_dict(),
            "first_name": leave.staff.first_name,
            "last_name": leave.staff.last_name
        } for leave in sorted_leaves]), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": "An Internal Error Occored"}), 500
    finally:
        storage.close()


@api_views.route("/leaves/<string:leave_id>")
@role_required(["staff", "manager", "admin"])
def get_leave_by_id(user_role: str, user_id: str, leave_id: str):
    """Retrieve leave data using it ID."""
    try:
        leave = storage.get_by(LeaveRequest, id=leave_id)
        if not leave:
            abort(404)
        return jsonify(leave.to_dict())
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()


@api_views.route("/leaves/<string:leave_id>/approve", methods=["PUT"])
@role_required(["manager", "admin"])
def approve_leave(user_role: str, user_id: str, leave_id: str):
    """Approved leave request from staff and send notification email."""
    try:
        leave = storage.get_by(LeaveRequest, id=leave_id)
        if not leave:
            abort(404)

        staff_email = leave.staff.email
        staff_name = leave.staff.first_name + " " + leave.staff.last_name
        if user_role == 'manager':
            leave.manager_approval_status = "approved"
        elif user_role == 'admin':
            leave.ceo_approval_status = "approved"

            # Read email from file and interpolate with staff data
            place_holder = {
                "staff_name": staff_name, "leave_type": leave.leave_type,
                "start_date": leave.start_date.strftime("%d/%m/%Y"), 
                "end_date": leave.end_date.strftime("%d/%m/%Y")
            }
            email_file = "app/templates/email_notification/leave_approval.html"
            email_content = read_html_file(email_file, place_holder)

            mail_subject = "[William's Court Hotel] Leave Approval Notification"
            recipient = {"name": staff_name, "email": staff_email}
            send_mail(email_content, recipient, mail_subject)

        storage.save()
        return jsonify({"message": "Leave Request Approved Successfully"}), 200
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()


@api_views.route("/leaves/<string:leave_id>/reject", methods=["PUT"])
@role_required(["manager", "admin"])
def reject_leave(user_role: str, user_id: str, leave_id: str):
    """Approved leave request from staff and send notification email."""
    try:
        description = request.get_json().get("description")
        leave = storage.get_by(LeaveRequest, id=leave_id)
        if not leave:
            abort(404)

        staff_email = leave.staff.email
        staff_name = leave.staff.first_name + " " + leave.staff.last_name
        if user_role == 'manager':
            leave.manager_approval_status = "rejected" 
        elif user_role == 'admin':
            leave.ceo_approval_status = "rejected"

            # Read email from file and interpolate with staff data
            place_holder = {
                "staff_name": staff_name, "leave_type": leave.leave_type,
                "start_date": leave.start_date.strftime("%d/%m/%Y"),
                "end_date": leave.end_date.strftime("%d/%m/%Y"),
                "rejection_reason": description
            }
            email_file = "app/templates/email_notification/leave_rejection.html"
            subject = "[William's Court Hotel] Leave Rejection Notification"
            email_content = read_html_file(email_file, place_holder)
            recipient = {"name": staff_name, "email": staff_email}
            send_mail(email_content, recipient, subject)
        leave.description = description
        storage.save()
        return jsonify({"message": "Leave Request Rejected Successfully"}), 200
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()
