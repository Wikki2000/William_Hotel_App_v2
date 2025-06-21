#!/usr/bin/python3
"""Handle API request for loan request"""
from models.loan_request import LoanRequest
from models.user import User
from flask import abort, jsonify, request
from api.v1.views import api_views
from api.v1.views.utils import (
    role_required, bad_request, read_html_file, send_mail
)
from models import storage


@api_views.route("/request-loan", methods=["POST"])
@role_required(["staff", "manager", "admin"])
def loan_request(user_role: str, user_id: str):
    """Request for loan"""
    data = request.get_json()

    required_fields = ["amount", "due_month", "repayment_mode", "staff_name",
                       "bank_name", "account_name", "account_number"]
    error_response = bad_request(data, required_fields)
    if error_response:
        return jsonify(error_response), 400

    data["staff_id"] = user_id  # Add staff ID to data
    staff_name = data.get("staff_name")

    try:
        del data["staff_name"]  # remove staff name
        req = LoanRequest(**data)
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
            "amount": str(f"₦{data.get('amount')}"),
            "due_month": f"{data.get('due_month')} Month(s)",
            "repayment_mode": data.get("repayment_mode"),
        }

        email_file = "app/templates/email_notification/loan_notify_management.html"
        subject = "[William's Court Hotel] Loan Request Notification"
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


@api_views.route("/loans")
@role_required(["staff", "manager", "admin"])
def all_loans(user_role: str, user_id: str):
    """Retrieve all loans in database."""
    loans  = storage.all(LoanRequest).values()
    if not loans:
        return jsonify([]), 200

    sorted_loans = sorted(loans, key=lambda loan: loan.updated_at)
    response = [{
        **loan.to_dict(),
        "first_name": loan.staff.first_name,
        "last_name": loan.staff.last_name
    } for loan in sorted_loans]
    storage.close()
    return jsonify(response), 200 


@api_views.route("/members/<member_id>/loans")
@role_required(["staff", "manager", "admin"])
def get_loans(user_role: str, user_id: str, member_id: str):
    """Retrieve loans request for a user in db."""
    try:
        user = storage.get_by(User, id=member_id)
        if not user:
            abort(404)
        sorted_loans = sorted(
            user.loans, key=lambda loan: loan.updated_at, reverse=True
        )
        return jsonify([{
            **loan.to_dict(),
            "first_name": loan.staff.first_name,
            "last_name": loan.staff.last_name
        } for loan in sorted_loans]), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": "An Internal Error Occored"}), 500
    finally:
        storage.close()


@api_views.route("/loans/<string:loan_id>")
@role_required(["staff", "manager", "admin"])
def get_loan_by_id(user_role: str, user_id: str, loan_id: str):
    """Retrieve loan data using it ID."""
    try:
        loan = storage.get_by(LoanRequest, id=loan_id)
        if not loan:
            abort(404)
        return jsonify(loan.to_dict())
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()


@api_views.route("/loans/<string:loan_id>/approve")
@role_required(["manager", "admin"])
def approve_loan_request(user_role: str, user_id: str, loan_id: str):
    """Approved loan request from staff and send notification email."""
    try:
        loan = storage.get_by(LoanRequest, id=loan_id)
        if not loan:
            abort(404)

        if user_role == 'admin':
            return jsonify({"msg": user_role}), 200
        elif user_role == 'manager':
            return jsonify({"msg": user_role}), 200
        else:
            return jsonify({"error": "Forbidden Access"}), 403
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()


@api_views.route("/loans/<string:loan_id>/reject", methods=["PUT"])
@role_required(["manager", "admin"])
def reject_loan(user_role: str, user_id: str, loan_id: str):
    """Reject loan request from staff and send notification email."""
    try:
        description = request.get_json().get("description")
        loan = storage.get_by(LoanRequest, id=loan_id)
        if not loan:
            abort(404)

        staff_email = loan.staff.email
        staff_name = loan.staff.first_name + " " + loan.staff.last_name
        if user_role == 'manager':
            loan.manager_approval_status = "rejected"
        elif user_role == 'admin':
            loan.ceo_approval_status = "rejected"

            # Read email from file and interpolate with staff data
            place_holder = {
                "staff_name": staff_name, "amount": str(f"₦{loan.amount}"),
                "due_month": f"{loan.due_month} Month(s)",
                "repayment_mode": loan.repayment_mode,
                "rejection_reason": description
            }
            email_file = "app/templates/email_notification/loan_rejection.html"
            subject = "[William's Court Hotel] Loan Rejection Notification"
            email_content = read_html_file(email_file, place_holder)
            recipient = {"name": staff_name, "email": staff_email}
            send_mail(email_content, recipient, subject)
        loan.description = description
        storage.save()
        return jsonify({"message": "Loan Request Rejected Successfully"}), 200
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()


@api_views.route("/loans/<string:loan_id>/approve", methods=["PUT"])
@role_required(["manager", "admin"])
def approve_loan(user_role: str, user_id: str, loan_id: str):
    """Approved loan request from staff and send notification email."""
    try:
        loan = storage.get_by(LoanRequest, id=loan_id)
        if not loan:
            abort(404)

        staff_email = loan.staff.email
        staff_name = loan.staff.first_name + " " + loan.staff.last_name
        if user_role == 'manager':
            loan.manager_approval_status = "approved"
        elif user_role == 'admin':
            loan.ceo_approval_status = "approved"

            # Read email from file and interpolate with staff data
            place_holder = {
                "staff_name": staff_name, "amount":  str(f"₦{loan.amount}"),
                "due_month": f"{loan.due_month} Month(s)",
                "repayment_mode": loan.repayment_mode,
            }
            email_file = "app/templates/email_notification/loan_approval.html"
            subject = "[William's Court Hotel] Loan Approval Notification"
            email_content = read_html_file(email_file, place_holder)
            recipient = {"name": staff_name, "email": staff_email}
            send_mail(email_content, recipient, subject)
        storage.save()
        return jsonify({"message": "Loan Request Approved Successfully"}), 200
    except Exception as e:
        print(str(e))
        abort(500)
    finally:
        storage.close()
