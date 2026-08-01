"""Environment-backed configuration shared by web and scheduled processes."""

import os

from dotenv import load_dotenv

load_dotenv()


def _database_url(value):
    """Convert Render's legacy Postgres URL to SQLAlchemy's psycopg dialect."""
    if value.startswith("postgres://"):
        return value.replace("postgres://", "postgresql+psycopg://", 1)
    if value.startswith("postgresql://") and "+psycopg" not in value:
        return value.replace("postgresql://", "postgresql+psycopg://", 1)
    return value


class Config:
    """Safe defaults make local setup straightforward; production values come from secrets."""

    SQLALCHEMY_DATABASE_URI = _database_url(
        os.getenv("DATABASE_URL", "sqlite:///aarna-recruitment.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    SECRET_KEY = os.getenv("TOKEN_SECRET", "development-only-change-me")
    TOKEN_SECRET = os.getenv("TOKEN_SECRET", "development-only-change-me")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me")
    ALLOWED_EMAIL_DOMAIN = os.getenv("ALLOWED_EMAIL_DOMAIN", "college.edu").lower().strip()
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGIN", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "").strip()
    GOOGLE_SHEET_TAB = os.getenv("GOOGLE_SHEET_TAB", "Applications").strip()
    GOOGLE_SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
    ADMIN_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 8
    SHEETS_SYNC_BATCH_SIZE = 200
