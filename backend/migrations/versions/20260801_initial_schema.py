"""Create the application and Sheets sync audit tables.

Revision ID: 20260801_initial
Revises:
Create Date: 2026-08-01
"""

from alembic import op
import sqlalchemy as sa

revision = "20260801_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "applications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("college_email", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=15), nullable=False),
        sa.Column("roll_number", sa.String(length=30), nullable=False),
        sa.Column("academic_department", sa.String(length=100), nullable=False),
        sa.Column("year", sa.SmallInteger(), nullable=False),
        sa.Column("section", sa.String(length=10), nullable=True),
        sa.Column("primary_portfolio", sa.String(length=60), nullable=False),
        sa.Column("secondary_portfolio", sa.String(length=60), nullable=False),
        sa.Column("skills", sa.Text(), nullable=False),
        sa.Column("experience", sa.Text(), nullable=False),
        sa.Column("motivation", sa.Text(), nullable=False),
        sa.Column("sync_state", sa.String(length=20), nullable=False),
        sa.Column("sync_attempts", sa.Integer(), nullable=False),
        sa.Column("last_sync_error", sa.Text(), nullable=True),
        sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("college_email"),
        sa.UniqueConstraint("phone"),
    )
    op.create_index("ix_applications_college_email", "applications", ["college_email"])
    op.create_index("ix_applications_phone", "applications", ["phone"])
    op.create_index("ix_applications_primary_portfolio", "applications", ["primary_portfolio"])
    op.create_index("ix_applications_submitted_at", "applications", ["submitted_at"])
    op.create_index("ix_applications_sync_state", "applications", ["sync_state"])

    op.create_table(
        "sheet_sync_runs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("attempted_count", sa.Integer(), nullable=False),
        sa.Column("synced_count", sa.Integer(), nullable=False),
        sa.Column("recovered_count", sa.Integer(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sheet_sync_runs_started_at", "sheet_sync_runs", ["started_at"])


def downgrade():
    op.drop_index("ix_sheet_sync_runs_started_at", table_name="sheet_sync_runs")
    op.drop_table("sheet_sync_runs")
    op.drop_index("ix_applications_sync_state", table_name="applications")
    op.drop_index("ix_applications_submitted_at", table_name="applications")
    op.drop_index("ix_applications_primary_portfolio", table_name="applications")
    op.drop_index("ix_applications_phone", table_name="applications")
    op.drop_index("ix_applications_college_email", table_name="applications")
    op.drop_table("applications")
