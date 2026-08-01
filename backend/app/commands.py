"""Flask CLI commands used by Render Cron Jobs and local operations."""

import click
from flask import current_app

from .services.sheets import GoogleSheetsSynchronizer


def register_commands(app):
    """Register the command rather than coupling it to application construction."""

    @app.cli.command("sync-sheets")
    def sync_sheets():
        """Export unsynced applications to Google Sheets and exit with useful status."""
        try:
            run = GoogleSheetsSynchronizer().sync()
        except Exception as error:
            current_app.logger.exception("Google Sheets sync failed")
            raise click.ClickException(str(error)) from error
        click.echo(
            f"Sheets sync {run.status}: appended={run.synced_count}, recovered={run.recovered_count}"
        )
