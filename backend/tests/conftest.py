"""Shared Flask test application and valid OC application payload."""

import pytest

from app import create_app
from app.extensions import db


@pytest.fixture()
def app():
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite://",
            "ALLOWED_EMAIL_DOMAIN": "college.edu",
            "ADMIN_PASSWORD": "reviewer-password",
            "TOKEN_SECRET": "test-secret",
            "CORS_ORIGINS": ["http://localhost:5173"],
        }
    )
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def application_payload():
    return {
        "fullName": "Aarna Applicant",
        "collegeEmail": "applicant@college.edu",
        "phone": "9876543210",
        "rollNumber": "CSBS-2026-001",
        "academicDepartment": "Computer Science and Business Systems",
        "year": 1,
        "section": "A",
        "primaryPortfolio": "Technical team",
        "secondaryPortfolio": "Documentation team",
        "skills": "Python, React, public speaking",
        "experience": "I have helped run two college workshops.",
        "motivation": "I want to build practical skills while helping AARNA create meaningful opportunities.",
    }
