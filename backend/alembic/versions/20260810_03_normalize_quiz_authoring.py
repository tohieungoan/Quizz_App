"""normalize existing quiz authoring data

Revision ID: 20260810_03
Revises: 20260810_02
Create Date: 2026-08-10
"""

from alembic import op
import sqlalchemy as sa


revision = "20260810_03"
down_revision = "20260810_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("UPDATE quizzes SET shuffle_options = TRUE WHERE shuffle_options IS NULL")
        op.execute("UPDATE quizzes SET version = 1 WHERE version IS NULL OR version < 1")
        op.execute(
            """
            WITH ranked AS (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY quiz_id ORDER BY id) - 1 AS new_position
                FROM questions
            )
            UPDATE questions
            SET position = ranked.new_position
            FROM ranked
            WHERE questions.id = ranked.id
            """
        )
        op.alter_column("quizzes", "shuffle_options", existing_type=sa.Boolean(), nullable=False)
        op.alter_column("quizzes", "version", existing_type=sa.Integer(), nullable=False)
        op.alter_column("questions", "position", existing_type=sa.Integer(), nullable=False)


def downgrade() -> None:
    # Data normalization is intentionally retained on downgrade.
    pass
