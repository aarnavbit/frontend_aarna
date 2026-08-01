"""Public health and application-submission endpoints."""

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import text

from ..constants import PORTFOLIOS, YEARS
from ..errors import ApiError
from ..extensions import db
from ..models import Application
from ..repositories.applications import find_contact_conflict
from ..schemas import validate_application_payload

public_bp = Blueprint("public", __name__)


@public_bp.get("/health")
def health_check():
    """Confirm the API and its database connection are ready."""
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        return jsonify({"status": "degraded", "service": "aarna-recruitment-api"}), 503
    return jsonify({"status": "ok", "service": "aarna-recruitment-api"}), 200


@public_bp.get("/application-options")
def application_options():
    """Expose fixed choices so the user interface and API remain aligned."""
    return jsonify({"portfolios": PORTFOLIOS, "years": YEARS}), 200


@public_bp.post("/applications")
def create_application():
    """Persist an application before any asynchronous Google Sheets export."""
    data = request.get_json(silent=True)
    payload = validate_application_payload(data, current_app.config["ALLOWED_EMAIL_DOMAIN"])
    existing = db.session.execute(
        find_contact_conflict(payload["college_email"], payload["phone"])
    ).scalar_one_or_none()
    if existing:
        field = "collegeEmail" if existing.college_email == payload["college_email"] else "phone"
        raise ApiError(
            "duplicate_application",
            "An application already exists for this email or phone number.",
            409,
            {field: "This detail has already been used for an application."},
        )

    application = Application(**payload)
    db.session.add(application)
    db.session.commit()
    return (
        jsonify(
            {
                "applicationId": str(application.id),
                "submittedAt": application.submitted_at.isoformat(),
                "syncStatus": application.sync_state,
                "message": "Your application has been saved. It will appear in the club sheet shortly.",
            }
        ),
        201,
    )
