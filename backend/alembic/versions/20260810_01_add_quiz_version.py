"""add baseline quiz authoring columns

Revision ID: 20260810_01
Revises: 20260809_00
Create Date: 2026-08-10
"""

from alembic import op
import sqlalchemy as sa


revision = "20260810_01"
down_revision = "20260809_00"
branch_labels = None
depends_on = None


def _column_names(table_name: str) -> set[str]:
    return {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns(table_name)
    }


def upgrade() -> None:
    if "version" not in _column_names("quizzes"):
        op.add_column(
            "quizzes",
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        )
    if "shuffle_options" not in _column_names("quizzes"):
        op.add_column(
            "quizzes",
            sa.Column("shuffle_options", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
    if "position" not in _column_names("questions"):
        op.add_column(
            "questions",
            sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        )


def downgrade() -> None:
    if "position" in _column_names("questions"):
        op.drop_column("questions", "position")
    if "shuffle_options" in _column_names("quizzes"):
        op.drop_column("quizzes", "shuffle_options")
    if "version" in _column_names("quizzes"):
        op.drop_column("quizzes", "version")
