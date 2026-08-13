"""enterprise quiz drafts and owned media registry

Revision ID: 20260810_02
Revises: 20260810_01
Create Date: 2026-08-10
"""

from alembic import op
import sqlalchemy as sa


revision = "20260810_02"
down_revision = "20260810_01"
branch_labels = None
depends_on = None


def _columns(inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def _add_column_if_missing(inspector, table: str, column: sa.Column) -> None:
    if column.name not in _columns(inspector, table):
        op.add_column(table, column)


def _index_names(inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    _add_column_if_missing(
        inspector, "quizzes", sa.Column("shuffle_options", sa.Boolean(), nullable=False, server_default=sa.true())
    )
    inspector = sa.inspect(bind)
    _add_column_if_missing(
        inspector, "quizzes", sa.Column("version", sa.Integer(), nullable=False, server_default="1")
    )
    inspector = sa.inspect(bind)
    _add_column_if_missing(inspector, "quizzes", sa.Column("draft_key", sa.String(length=64), nullable=True))
    inspector = sa.inspect(bind)
    _add_column_if_missing(inspector, "quizzes", sa.Column("draft_builder_state", sa.JSON(), nullable=True))
    inspector = sa.inspect(bind)
    _add_column_if_missing(inspector, "quizzes", sa.Column("published_at", sa.DateTime(), nullable=True))

    inspector = sa.inspect(bind)
    _add_column_if_missing(
        inspector, "questions", sa.Column("position", sa.Integer(), nullable=False, server_default="0")
    )
    inspector = sa.inspect(bind)
    _add_column_if_missing(inspector, "questions", sa.Column("explanation", sa.Text(), nullable=True))

    upload_columns = [
        sa.Column("public_id", sa.String(length=255), nullable=True),
        sa.Column("secure_url", sa.String(length=2048), nullable=True),
        sa.Column("resource_type", sa.String(length=20), nullable=True),
        sa.Column("bytes", sa.BigInteger(), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="PENDING"),
        sa.Column("delete_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    ]
    for column in upload_columns:
        inspector = sa.inspect(bind)
        _add_column_if_missing(inspector, "upload_files", column)

    inspector = sa.inspect(bind)
    quiz_indexes = _index_names(inspector, "quizzes")
    if "ix_quizzes_draft_key" not in quiz_indexes:
        op.create_index("ix_quizzes_draft_key", "quizzes", ["draft_key"], unique=True)

    inspector = sa.inspect(bind)
    upload_indexes = _index_names(inspector, "upload_files")
    if "ix_upload_files_public_id" not in upload_indexes:
        op.create_index("ix_upload_files_public_id", "upload_files", ["public_id"], unique=True)
    if "ux_upload_files_secure_url" not in upload_indexes:
        op.create_index("ux_upload_files_secure_url", "upload_files", ["secure_url"], unique=True)
    if "ix_upload_files_status" not in upload_indexes:
        op.create_index("ix_upload_files_status", "upload_files", ["status"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    upload_indexes = _index_names(inspector, "upload_files")
    for name in ["ix_upload_files_status", "ux_upload_files_secure_url", "ix_upload_files_public_id"]:
        if name in upload_indexes:
            op.drop_index(name, table_name="upload_files")
    quiz_indexes = _index_names(sa.inspect(bind), "quizzes")
    if "ix_quizzes_draft_key" in quiz_indexes:
        op.drop_index("ix_quizzes_draft_key", table_name="quizzes")

    for name in [
        "deleted_at", "updated_at", "last_error", "delete_attempts", "status",
        "bytes", "resource_type", "secure_url", "public_id",
    ]:
        if name in _columns(sa.inspect(bind), "upload_files"):
            op.drop_column("upload_files", name)
    for name in ["explanation", "position"]:
        if name in _columns(sa.inspect(bind), "questions"):
            op.drop_column("questions", name)
    for name in ["published_at", "draft_builder_state", "draft_key", "version", "shuffle_options"]:
        if name in _columns(sa.inspect(bind), "quizzes"):
            op.drop_column("quizzes", name)
