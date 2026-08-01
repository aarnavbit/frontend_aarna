"""Stateless password login and signed bearer-token protection for reviewers."""

from functools import wraps
from hmac import compare_digest

from flask import current_app, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from .errors import ApiError

TOKEN_SALT = "aarna-reviewer-session"


def _serializer():
    return URLSafeTimedSerializer(current_app.config["TOKEN_SECRET"])


def create_admin_token():
    """Issue a signed, time-limited token without persisting an admin session."""
    return _serializer().dumps({"role": "reviewer"}, salt=TOKEN_SALT)


def require_admin(view):
    """Require an Authorization bearer token for every reviewer endpoint."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        token = header.removeprefix("Bearer ").strip() if header.startswith("Bearer ") else ""
        if not token:
            raise ApiError("authentication_required", "Sign in to access reviewer data.", 401)
        try:
            payload = _serializer().loads(
                token, max_age=current_app.config["ADMIN_TOKEN_MAX_AGE_SECONDS"], salt=TOKEN_SALT
            )
        except (BadSignature, SignatureExpired):
            raise ApiError("invalid_session", "Your reviewer session has expired. Sign in again.", 401)
        if payload.get("role") != "reviewer":
            raise ApiError("forbidden", "You do not have reviewer access.", 403)
        return view(*args, **kwargs)

    return wrapped


def password_is_valid(password):
    """Use constant-time comparison for the single environment-configured password."""
    return isinstance(password, str) and compare_digest(
        password, current_app.config["ADMIN_PASSWORD"]
    )
