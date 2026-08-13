"""baseline the legacy application schema

Revision ID: 20260809_00
Revises:
Create Date: 2026-08-09

This transitional baseline allows a fresh clone to bootstrap the pre-Alembic
schema. All changes after this point are represented by explicit revisions.
"""

from alembic import op

from app.db.base import Base
import app.models  # noqa: F401 - register all model metadata


revision = "20260809_00"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    # The baseline represents pre-existing production data and intentionally
    # refuses to perform a destructive drop-all downgrade.
    pass
