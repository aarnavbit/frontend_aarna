"""Password-authenticated, read-only reviewer endpoints."""

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import func

from ..auth import create_admin_token, password_is_valid, require_admin
from ..constants import PORTFOLIOS, YEARS
from ..errors import ApiError
from ..extensions import db
from ..models import Application
from ..repositories.applications import latest_sync_run_query, reviewer_query

admin_bp = Blueprint("admin", __name__)


def _integer_query_arg(name, default, minimum, maximum):
    """Parse a bounded pagination argument without exposing conversion errors."""
    try:
        value = int(request.args.get(name, default))
    except (TypeError, ValueError):
        raise ApiError("invalid_query", f"{name} must be a number.")
    if not minimum <= value <= maximum:
        raise ApiError("invalid_query", f"{name} must be between {minimum} and {maximum}.")
    return value


@admin_bp.post("/session")
def create_session():
    """Validate the club password and issue an in-memory dashboard token."""
    data = request.get_json(silent=True) or {}
    if not password_is_valid(data.get("password")):
        raise ApiError("invalid_credentials", "The reviewer password is incorrect.", 401)
    return jsonify(
        {
            "token": create_admin_token(),
            "expiresInSeconds": current_app.config["ADMIN_TOKEN_MAX_AGE_SECONDS"],
        }
    ), 200


@admin_bp.get("/applications")
@require_admin
def list_applications():
    """Return a paginated, filterable reviewer-only application list."""
    search_term = (request.args.get("q") or "").strip()
    year = request.args.get("year", type=int)
    portfolio = request.args.get("portfolio")
    sync_state = request.args.get("syncState")
    if year is not None and year not in YEARS:
        raise ApiError("invalid_query", "year must be 2 because only second-year students are eligible.")
    if portfolio and portfolio not in PORTFOLIOS:
        raise ApiError("invalid_query", "portfolio is not valid.")
    if sync_state and sync_state not in ("pending", "synced"):
        raise ApiError("invalid_query", "syncState must be pending or synced.")
    limit = _integer_query_arg("limit", 25, 1, 100)
    offset = _integer_query_arg("offset", 0, 0, 100000)
    statement = reviewer_query(search_term, year, portfolio, sync_state)
    records = db.session.execute(statement.offset(offset).limit(limit)).scalars().all()
    count_statement = statement.with_only_columns(func.count()).order_by(None)
    total = db.session.execute(count_statement).scalar_one()
    return jsonify(
        {
            "applications": [record.to_dict() for record in records],
            "pagination": {"total": total, "limit": limit, "offset": offset},
        }
    ), 200


@admin_bp.get("/sync-status")
@require_admin
def sync_status():
    """Expose job health and outstanding rows to authenticated reviewers."""
    pending_count = db.session.scalar(
        db.select(func.count()).select_from(Application).where(Application.sync_state != "synced")
    )
    latest = db.session.execute(latest_sync_run_query()).scalar_one_or_none()
    return jsonify(
        {
            "pendingCount": pending_count,
            "lastRun": latest.to_dict() if latest else None,
        }
    ), 200
