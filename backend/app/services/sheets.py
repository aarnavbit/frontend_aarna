"""Reliable, idempotent Google Sheets batch export for submitted applications."""

import json
from datetime import datetime, timezone

from flask import current_app

from ..constants import SHEET_HEADERS
from ..extensions import db
from ..models import SheetSyncRun
from ..repositories.applications import pending_sync_query


class GoogleSheetsSynchronizer:
    """Copy unsynced Postgres applications to one shared Google Sheet."""

    def __init__(self):
        self.spreadsheet_id = current_app.config["GOOGLE_SHEET_ID"]
        self.sheet_tab = current_app.config["GOOGLE_SHEET_TAB"]
        self.credentials_json = current_app.config["GOOGLE_SERVICE_ACCOUNT_JSON"]
        self.batch_size = current_app.config["SHEETS_SYNC_BATCH_SIZE"]

    def _service(self):
        """Build an authenticated client only in the scheduled background process."""
        if not self.spreadsheet_id or not self.credentials_json:
            raise RuntimeError("Google Sheets configuration is incomplete.")
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build

        credentials = Credentials.from_service_account_info(
            json.loads(self.credentials_json),
            scopes=["https://www.googleapis.com/auth/spreadsheets"],
        )
        return build("sheets", "v4", credentials=credentials, cache_discovery=False)

    def _existing_ids(self, service):
        """Read the UUID column so retried jobs do not append duplicate rows."""
        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=self.spreadsheet_id, range=f"{self.sheet_tab}!A2:A")
            .execute()
        )
        return {row[0] for row in result.get("values", []) if row}

    def _ensure_header(self, service):
        """Create predictable headers when the target tab has no content."""
        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=self.spreadsheet_id, range=f"{self.sheet_tab}!A1:N1")
            .execute()
        )
        if not result.get("values"):
            (
                service.spreadsheets()
                .values()
                .update(
                    spreadsheetId=self.spreadsheet_id,
                    range=f"{self.sheet_tab}!A1",
                    valueInputOption="RAW",
                    body={"values": [list(SHEET_HEADERS)]},
                )
                .execute()
            )

    def sync(self):
        """Run one bounded export and retain an audit trail for the dashboard."""
        run = SheetSyncRun(status="running")
        db.session.add(run)
        db.session.commit()
        applications = db.session.execute(pending_sync_query(self.batch_size)).scalars().all()
        run.attempted_count = len(applications)

        if not applications:
            run.status = "success"
            run.completed_at = datetime.now(timezone.utc)
            db.session.commit()
            return run

        try:
            service = self._service()
            self._ensure_header(service)
            existing_ids = self._existing_ids(service)
            recovered = [item for item in applications if str(item.id) in existing_ids]
            to_append = [item for item in applications if str(item.id) not in existing_ids]
            if to_append:
                (
                    service.spreadsheets()
                    .values()
                    .append(
                        spreadsheetId=self.spreadsheet_id,
                        range=f"{self.sheet_tab}!A:N",
                        valueInputOption="RAW",
                        insertDataOption="INSERT_ROWS",
                        body={"values": [item.to_sheet_row() for item in to_append]},
                    )
                    .execute()
                )

            now = datetime.now(timezone.utc)
            for item in applications:
                item.sync_state = "synced"
                item.sync_attempts += 1
                item.last_sync_error = None
                item.synced_at = now
            run.status = "success"
            run.synced_count = len(to_append)
            run.recovered_count = len(recovered)
            run.completed_at = now
            db.session.commit()
            return run
        except Exception as error:
            message = str(error)[:1000]
            for item in applications:
                item.sync_attempts += 1
                item.last_sync_error = message
            run.status = "failed"
            run.error_message = message
            run.completed_at = datetime.now(timezone.utc)
            db.session.commit()
            raise
