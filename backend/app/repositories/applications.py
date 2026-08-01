"""Parameterized SQLAlchemy queries for application creation and reviewer search."""

from sqlalchemy import func, or_, select

from ..models import Application, SheetSyncRun


def find_contact_conflict(email, phone):
    """Find an existing record that owns either unique contact identifier."""
    statement = select(Application).where(
        or_(Application.college_email == email, Application.phone == phone)
    )
    return statement.order_by(Application.submitted_at.desc()).limit(1)


def reviewer_query(search_term=None, year=None, portfolio=None, sync_state=None):
    """Build the read-only reviewer query with safe bound parameters."""
    statement = select(Application)
    if search_term:
        pattern = f"%{search_term.lower()}%"
        statement = statement.where(
            or_(
                func.lower(Application.full_name).like(pattern),
                func.lower(Application.college_email).like(pattern),
                func.lower(Application.roll_number).like(pattern),
            )
        )
    if year:
        statement = statement.where(Application.year == year)
    if portfolio:
        statement = statement.where(
            or_(
                Application.primary_portfolio == portfolio,
                Application.secondary_portfolio == portfolio,
            )
        )
    if sync_state:
        statement = statement.where(Application.sync_state == sync_state)
    return statement.order_by(Application.submitted_at.desc())


def pending_sync_query(limit):
    """Fetch the oldest unsynced records for one bounded Sheets batch."""
    return (
        select(Application)
        .where(Application.sync_state != "synced")
        .order_by(Application.submitted_at.asc())
        .limit(limit)
    )


def latest_sync_run_query():
    """Fetch the newest completed or failed background-sync summary."""
    return select(SheetSyncRun).order_by(SheetSyncRun.started_at.desc()).limit(1)
