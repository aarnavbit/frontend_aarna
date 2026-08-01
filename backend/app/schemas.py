"""Request parsing and validation for public application JSON payloads."""

import re

from .constants import PORTFOLIOS, YEARS
from .errors import ApiError

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _text(data, field, label, minimum=1, maximum=100, optional=False):
    """Normalize a text field and record a helpful field-level validation error."""
    value = data.get(field)
    if value is None and optional:
        return None, None
    if not isinstance(value, str):
        return None, f"{label} is required."
    value = " ".join(value.strip().split())
    if optional and not value:
        return None, None
    if len(value) < minimum or len(value) > maximum:
        return None, f"{label} must be between {minimum} and {maximum} characters."
    return value, None


def validate_application_payload(data, allowed_email_domain):
    """Return clean model data or raise one JSON error containing all invalid fields."""
    if not isinstance(data, dict):
        raise ApiError("invalid_json", "Send a JSON object as the request body.")

    clean = {}
    fields = {}
    text_rules = (
        ("fullName", "full_name", "Full name", 2, 100, False),
        ("rollNumber", "roll_number", "Roll number", 2, 30, False),
        ("academicDepartment", "academic_department", "Academic department", 2, 100, False),
        ("section", "section", "Section", 1, 10, True),
        ("skills", "skills", "Skills", 2, 1000, False),
        ("experience", "experience", "Experience", 2, 1500, False),
        ("motivation", "motivation", "Motivation", 20, 2000, False),
    )
    for request_key, model_key, label, minimum, maximum, optional in text_rules:
        value, error = _text(data, request_key, label, minimum, maximum, optional)
        if error:
            fields[request_key] = error
        else:
            clean[model_key] = value

    email = data.get("collegeEmail")
    if not isinstance(email, str) or not EMAIL_PATTERN.match(email.strip()):
        fields["collegeEmail"] = "Enter a valid college email address."
    else:
        email = email.strip().lower()
        domain = email.rsplit("@", 1)[1]
        if domain != allowed_email_domain:
            fields["collegeEmail"] = f"Use your {allowed_email_domain} college email address."
        else:
            clean["college_email"] = email

    phone = data.get("phone")
    phone_digits = re.sub(r"\D", "", phone) if isinstance(phone, str) else ""
    if len(phone_digits) == 12 and phone_digits.startswith("91"):
        phone_digits = phone_digits[2:]
    if not re.fullmatch(r"[6-9]\d{9}", phone_digits):
        fields["phone"] = "Enter a valid 10-digit Indian phone number."
    else:
        clean["phone"] = phone_digits

    year = data.get("year")
    try:
        year = int(year)
    except (TypeError, ValueError):
        year = None
    if year not in YEARS:
        fields["year"] = "Select either first year or second year."
    else:
        clean["year"] = year

    for request_key, model_key in (
        ("primaryPortfolio", "primary_portfolio"),
        ("secondaryPortfolio", "secondary_portfolio"),
    ):
        value = data.get(request_key)
        if value not in PORTFOLIOS:
            fields[request_key] = "Choose a portfolio from the available options."
        else:
            clean[model_key] = value

    if (
        clean.get("primary_portfolio")
        and clean.get("primary_portfolio") == clean.get("secondary_portfolio")
    ):
        fields["secondaryPortfolio"] = "Your second preference must be different."

    if fields:
        raise ApiError("validation_error", "Please correct the highlighted fields.", fields=fields)
    return clean
