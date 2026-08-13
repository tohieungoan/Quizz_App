"""backfill publication state for legacy quizzes

Revision ID: 20260810_04
Revises: 20260810_03
Create Date: 2026-08-10
"""

from alembic import op


revision = "20260810_04"
down_revision = "20260810_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE quizzes
        SET published_at = COALESCE(updated_at, created_at)
        WHERE LOWER(COALESCE(status, '')) = 'published'
          AND published_at IS NULL
        """
    )


def downgrade() -> None:
    # Publication timestamps are business data and are intentionally retained.
    pass
