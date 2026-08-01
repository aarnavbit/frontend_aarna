"""PostgreSQL models for applications and their Google Sheets sync audit trail."""

import uuid

from sqlalchemy import Uuid, func

from .extensions import db


class Application(db.Model):
    """A submitted OC application; Postgres is the authoritative record."""

    __tablename__ = "applications"

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = db.Column(db.String(100), nullable=False)
    college_email = db.Column(db.String(120), nullable=False, unique=True, index=True)
    phone = db.Column(db.String(15), nullable=False, unique=True, index=True)
    roll_number = db.Column(db.String(30), nullable=False)
    academic_department = db.Column(db.String(100), nullable=False)
    year = db.Column(db.SmallInteger, nullable=False)
    section = db.Column(db.String(10), nullable=True)
    primary_portfolio = db.Column(db.String(60), nullable=False, index=True)
    secondary_portfolio = db.Column(db.String(60), nullable=False)
    skills = db.Column(db.Text, nullable=False)
    experience = db.Column(db.Text, nullable=False)
    motivation = db.Column(db.Text, nullable=False)
    sync_state = db.Column(db.String(20), nullable=False, default="pending", index=True)
    sync_attempts = db.Column(db.Integer, nullable=False, default=0)
    last_sync_error = db.Column(db.Text, nullable=True)
    synced_at = db.Column(db.DateTime(timezone=True), nullable=True)
    submitted_at = db.Column(
        db.DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

    def to_dict(self):
        """Serialize the complete record for authorized reviewer views."""
        return {
            "applicationId": str(self.id),
            "fullName": self.full_name,
            "collegeEmail": self.college_email,
            "phone": self.phone,
            "rollNumber": self.roll_number,
            "academicDepartment": self.academic_department,
            "year": self.year,
            "section": self.section,
            "primaryPortfolio": self.primary_portfolio,
            "secondaryPortfolio": self.secondary_portfolio,
            "skills": self.skills,
            "experience": self.experience,
            "motivation": self.motivation,
            "syncStatus": self.sync_state,
            "syncAttempts": self.sync_attempts,
            "lastSyncError": self.last_sync_error,
            "syncedAt": self.synced_at.isoformat() if self.synced_at else None,
            "submittedAt": self.submitted_at.isoformat() if self.submitted_at else None,
        }

    def to_sheet_row(self):
        """Return the stable column order used by the Google Sheets exporter."""
        return [
            str(self.id),
            self.submitted_at.isoformat() if self.submitted_at else "",
            self.full_name,
            self.college_email,
            self.phone,
            self.roll_number,
            self.academic_department,
            str(self.year),
            self.section or "",
            self.primary_portfolio,
            self.secondary_portfolio,
            self.skills,
            self.experience,
            self.motivation,
        ]


class SheetSyncRun(db.Model):
    """An immutable summary of a scheduled Sheets export attempt."""

    __tablename__ = "sheet_sync_runs"

    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), nullable=False)
    attempted_count = db.Column(db.Integer, nullable=False, default=0)
    synced_count = db.Column(db.Integer, nullable=False, default=0)
    recovered_count = db.Column(db.Integer, nullable=False, default=0)
    error_message = db.Column(db.Text, nullable=True)
    started_at = db.Column(
        db.DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    completed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    def to_dict(self):
        """Serialize sync health without exposing any service-account details."""
        return {
            "status": self.status,
            "attemptedCount": self.attempted_count,
            "syncedCount": self.synced_count,
            "recoveredCount": self.recovered_count,
            "errorMessage": self.error_message,
            "startedAt": self.started_at.isoformat() if self.started_at else None,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
        }
