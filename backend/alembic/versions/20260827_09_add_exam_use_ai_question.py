"""add use_ai_question column to exams table

Revision ID: 20260827_09
Revises: 20260826_08
Create Date: 2026-08-27
"""

from alembic import op
import sqlalchemy as sa


revision = "20260827_09"
down_revision = "20260826_08"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "exams",
        sa.Column("use_ai_question", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("exams", "use_ai_question")
