"""add immutable reusable quiz variant sets

Revision ID: 20260819_06
Revises: 20260811_05
Create Date: 2026-08-19
"""

from alembic import op
import sqlalchemy as sa


revision = "20260819_06"
down_revision = "20260811_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "quiz_variant_sets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("quiz_id", sa.Integer(), nullable=False),
        sa.Column("source_quiz_version", sa.Integer(), nullable=False),
        sa.Column("requested_count", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=24), server_default="PENDING", nullable=False),
        sa.Column("generation_key", sa.String(length=160), nullable=False),
        sa.Column("prompt_version", sa.String(length=32), nullable=False),
        sa.Column("generation_model", sa.String(length=100), nullable=True),
        sa.Column("attempt_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("requested_count BETWEEN 2 AND 5", name="ck_variant_set_count"),
        sa.CheckConstraint(
            "status IN ('PENDING','GENERATING','READY','PARTIAL','FAILED','SUPERSEDED')",
            name="ck_variant_set_status",
        ),
        sa.ForeignKeyConstraint(["quiz_id"], ["quizzes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("generation_key"),
    )
    op.create_index("ix_quiz_variant_sets_quiz_id", "quiz_variant_sets", ["quiz_id"])
    op.create_index("ix_quiz_variant_sets_status", "quiz_variant_sets", ["status"])

    op.create_table(
        "quiz_variants",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("variant_set_id", sa.Integer(), nullable=False),
        sa.Column("variant_index", sa.Integer(), nullable=False),
        sa.Column("version_code", sa.String(length=1), nullable=False),
        sa.Column("status", sa.String(length=24), server_default="PENDING", nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("variant_index BETWEEN 0 AND 4", name="ck_quiz_variant_index"),
        sa.CheckConstraint(
            "status IN ('PENDING','READY','FALLBACK','FAILED')",
            name="ck_quiz_variant_status",
        ),
        sa.ForeignKeyConstraint(["variant_set_id"], ["quiz_variant_sets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("variant_set_id", "variant_index", name="uq_variant_set_index"),
        sa.UniqueConstraint("variant_set_id", "version_code", name="uq_variant_set_code"),
    )
    op.create_index("ix_quiz_variants_variant_set_id", "quiz_variants", ["variant_set_id"])

    op.create_table(
        "quiz_variant_questions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("quiz_variant_id", sa.Integer(), nullable=False),
        sa.Column("original_question_id", sa.Integer(), nullable=True),
        sa.Column("type", sa.String(length=50), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("difficulty", sa.String(length=30), nullable=True),
        sa.Column("time_limit", sa.Integer(), nullable=True),
        sa.Column("media_url", sa.String(length=2048), nullable=True),
        sa.Column("audio_url", sa.String(length=2048), nullable=True),
        sa.Column("audio_play_limit", sa.Integer(), server_default="0", nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["original_question_id"], ["questions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["quiz_variant_id"], ["quiz_variants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("quiz_variant_id", "position", name="uq_variant_question_position"),
        sa.UniqueConstraint(
            "quiz_variant_id",
            "original_question_id",
            name="uq_variant_original_question",
        ),
    )
    op.create_index(
        "ix_quiz_variant_questions_quiz_variant_id",
        "quiz_variant_questions",
        ["quiz_variant_id"],
    )
    op.create_index(
        "ix_quiz_variant_questions_original_question_id",
        "quiz_variant_questions",
        ["original_question_id"],
    )

    op.create_table(
        "quiz_variant_options",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("variant_question_id", sa.Integer(), nullable=False),
        sa.Column("original_option_id", sa.Integer(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("media_url", sa.String(length=2048), nullable=True),
        sa.Column("audio_url", sa.String(length=2048), nullable=True),
        sa.Column("is_correct", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["original_option_id"], ["question_options.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["variant_question_id"],
            ["quiz_variant_questions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("variant_question_id", "position", name="uq_variant_option_position"),
        sa.UniqueConstraint(
            "variant_question_id",
            "original_option_id",
            name="uq_variant_original_option",
        ),
    )
    op.create_index(
        "ix_quiz_variant_options_variant_question_id",
        "quiz_variant_options",
        ["variant_question_id"],
    )
    op.create_index(
        "ix_quiz_variant_options_original_option_id",
        "quiz_variant_options",
        ["original_option_id"],
    )

    op.add_column(
        "quizzes",
        sa.Column("variant_enabled", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column(
        "quizzes",
        sa.Column("variant_count", sa.Integer(), server_default="5", nullable=False),
    )
    op.add_column("quizzes", sa.Column("active_variant_set_id", sa.Integer(), nullable=True))
    op.create_check_constraint("ck_quizzes_variant_count", "quizzes", "variant_count BETWEEN 2 AND 5")
    op.create_foreign_key(
        "fk_quizzes_active_variant_set_id",
        "quizzes",
        "quiz_variant_sets",
        ["active_variant_set_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_quizzes_active_variant_set_id", "quizzes", ["active_variant_set_id"])

    _add_delivery_columns()


def _add_delivery_columns() -> None:
    op.add_column("exams", sa.Column("variant_set_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_exams_variant_set_id",
        "exams",
        "quiz_variant_sets",
        ["variant_set_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index("ix_exams_variant_set_id", "exams", ["variant_set_id"])

    op.add_column("exam_assignees", sa.Column("quiz_variant_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_exam_assignees_quiz_variant_id",
        "exam_assignees",
        "quiz_variants",
        ["quiz_variant_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index("ix_exam_assignees_quiz_variant_id", "exam_assignees", ["quiz_variant_id"])

    for column_name, target_table in [
        ("variant_question_id", "quiz_variant_questions"),
        ("variant_option_id", "quiz_variant_options"),
    ]:
        op.add_column("exam_answers", sa.Column(column_name, sa.Integer(), nullable=True))
        op.create_foreign_key(
            f"fk_exam_answers_{column_name}",
            "exam_answers",
            target_table,
            [column_name],
            ["id"],
            ondelete="RESTRICT",
        )
        op.create_index(f"ix_exam_answers_{column_name}", "exam_answers", [column_name])

    op.add_column("rooms", sa.Column("variant_set_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_rooms_variant_set_id",
        "rooms",
        "quiz_variant_sets",
        ["variant_set_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index("ix_rooms_variant_set_id", "rooms", ["variant_set_id"])

    op.add_column("participants", sa.Column("quiz_variant_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_participants_quiz_variant_id",
        "participants",
        "quiz_variants",
        ["quiz_variant_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index("ix_participants_quiz_variant_id", "participants", ["quiz_variant_id"])

    for column_name, target_table in [
        ("variant_question_id", "quiz_variant_questions"),
        ("variant_option_id", "quiz_variant_options"),
    ]:
        op.add_column("participant_answers", sa.Column(column_name, sa.Integer(), nullable=True))
        op.create_foreign_key(
            f"fk_participant_answers_{column_name}",
            "participant_answers",
            target_table,
            [column_name],
            ["id"],
            ondelete="RESTRICT",
        )
        op.create_index(
            f"ix_participant_answers_{column_name}",
            "participant_answers",
            [column_name],
        )


def downgrade() -> None:
    for table, columns in [
        ("participant_answers", ["variant_option_id", "variant_question_id"]),
        ("exam_answers", ["variant_option_id", "variant_question_id"]),
    ]:
        for column_name in columns:
            op.drop_index(f"ix_{table}_{column_name}", table_name=table)
            op.drop_constraint(f"fk_{table}_{column_name}", table, type_="foreignkey")
            op.drop_column(table, column_name)

    for table, column, constraint in [
        ("participants", "quiz_variant_id", "fk_participants_quiz_variant_id"),
        ("rooms", "variant_set_id", "fk_rooms_variant_set_id"),
        ("exam_assignees", "quiz_variant_id", "fk_exam_assignees_quiz_variant_id"),
        ("exams", "variant_set_id", "fk_exams_variant_set_id"),
    ]:
        op.drop_index(f"ix_{table}_{column}", table_name=table)
        op.drop_constraint(constraint, table, type_="foreignkey")
        op.drop_column(table, column)

    op.drop_index("ix_quizzes_active_variant_set_id", table_name="quizzes")
    op.drop_constraint("fk_quizzes_active_variant_set_id", "quizzes", type_="foreignkey")
    op.drop_constraint("ck_quizzes_variant_count", "quizzes", type_="check")
    op.drop_column("quizzes", "active_variant_set_id")
    op.drop_column("quizzes", "variant_count")
    op.drop_column("quizzes", "variant_enabled")

    op.drop_table("quiz_variant_options")
    op.drop_table("quiz_variant_questions")
    op.drop_table("quiz_variants")
    op.drop_table("quiz_variant_sets")
