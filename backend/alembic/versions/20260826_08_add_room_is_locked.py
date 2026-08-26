"""add is_locked column to rooms table

Revision ID: 20260826_08
Revises: 20260821_07
Create Date: 2026-08-26
"""

from alembic import op
import sqlalchemy as sa


revision = "20260826_08"
down_revision = "20260821_07"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "rooms",
        sa.Column("is_locked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("rooms", "is_locked")
