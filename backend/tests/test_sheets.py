"""Sheets synchronizer tests with a local fake Google Sheets client."""

import pytest

from app.extensions import db
from app.models import Application, SheetSyncRun
from app.services.sheets import GoogleSheetsSynchronizer


class FakeRequest:
    def __init__(self, payload=None, error=None):
        self.payload = payload or {}
        self.error = error

    def execute(self):
        if self.error:
            raise self.error
        return self.payload


class FakeValues:
    def __init__(self, existing_ids=None, fail_append=False):
        self.existing_ids = existing_ids or set()
        self.fail_append = fail_append
        self.appended_rows = []

    def get(self, **kwargs):
        if kwargs["range"].endswith("A2:A"):
            return FakeRequest({"values": [[value] for value in self.existing_ids]})
        return FakeRequest({"values": [["Application ID"]]})

    def update(self, **kwargs):
        return FakeRequest()

    def append(self, **kwargs):
        self.appended_rows.extend(kwargs["body"]["values"])
        error = RuntimeError("Sheets is unavailable") if self.fail_append else None
        return FakeRequest(error=error)


class FakeSheets:
    def __init__(self, values):
        self.values_client = values

    def values(self):
        return self.values_client


class FakeService:
    def __init__(self, values):
        self.values_client = values

    def spreadsheets(self):
        return FakeSheets(self.values_client)


def _application():
    return Application(
        full_name="Aarna Applicant",
        college_email="sheet@college.edu",
        phone="9876543210",
        roll_number="CSBS-001",
        academic_department="CSBS",
        year=1,
        primary_portfolio="Technical team",
        secondary_portfolio="Documentation team",
        skills="Python and React",
        experience="Workshop volunteer",
        motivation="I would like to contribute to the AARNA community.",
    )


def test_sync_appends_pending_application(app, monkeypatch):
    with app.app_context():
        record = _application()
        db.session.add(record)
        db.session.commit()
        values = FakeValues()
        monkeypatch.setattr(GoogleSheetsSynchronizer, "_service", lambda _: FakeService(values))

        run = GoogleSheetsSynchronizer().sync()

        assert run.status == "success"
        assert run.synced_count == 1
        assert values.appended_rows[0][0] == str(record.id)
        assert db.session.get(Application, record.id).sync_state == "synced"


def test_sync_failure_stays_pending_for_retry(app, monkeypatch):
    with app.app_context():
        record = _application()
        db.session.add(record)
        db.session.commit()
        values = FakeValues(fail_append=True)
        monkeypatch.setattr(GoogleSheetsSynchronizer, "_service", lambda _: FakeService(values))

        with pytest.raises(RuntimeError, match="unavailable"):
            GoogleSheetsSynchronizer().sync()

        saved = db.session.get(Application, record.id)
        assert saved.sync_state == "pending"
        assert saved.sync_attempts == 1
        assert db.session.query(SheetSyncRun).one().status == "failed"


def test_existing_sheet_uuid_is_recovered_without_duplicate_append(app, monkeypatch):
    with app.app_context():
        record = _application()
        db.session.add(record)
        db.session.commit()
        values = FakeValues(existing_ids={str(record.id)})
        monkeypatch.setattr(GoogleSheetsSynchronizer, "_service", lambda _: FakeService(values))

        run = GoogleSheetsSynchronizer().sync()

        assert run.recovered_count == 1
        assert run.synced_count == 0
        assert values.appended_rows == []
