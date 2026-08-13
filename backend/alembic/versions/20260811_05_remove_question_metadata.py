"""remove unused question source and explanation metadata

Revision ID: 20260811_05
Revises: 20260810_04
Create Date: 2026-08-11
"""

from alembic import op
import sqlalchemy as sa


revision = "20260811_05"
down_revision = "20260810_04"
branch_labels = None
depends_on = None


def _columns() -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {column["name"] for column in inspector.get_columns("questions")}


def upgrade() -> None:
    columns = _columns()
    if "source" in columns:
        op.drop_column("questions", "source")
    if "explanation" in columns:
        op.drop_column("questions", "explanation")


def downgrade() -> None:
    columns = _columns()
    if "source" not in columns:
        op.add_column("questions", sa.Column("source", sa.String(), nullable=True))
    if "explanation" not in columns:
        op.add_column("questions", sa.Column("explanation", sa.Text(), nullable=True))
