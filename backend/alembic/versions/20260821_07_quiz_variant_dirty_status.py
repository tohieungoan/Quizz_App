"""allow dirty status for manually edited quiz variant sets

Revision ID: 20260821_07
Revises: 20260819_06
Create Date: 2026-08-21
"""

from alembic import op


revision = "20260821_07"
down_revision = "20260819_06"
branch_labels = None
depends_on = None


_STATUS_CONSTRAINT = "ck_variant_set_status"
_STATUS_WITH_DIRTY = (
    "status IN ('PENDING','GENERATING','READY','DIRTY','PARTIAL','FAILED','SUPERSEDED')"
)
_STATUS_WITHOUT_DIRTY = (
    "status IN ('PENDING','GENERATING','READY','PARTIAL','FAILED','SUPERSEDED')"
)


def upgrade() -> None:
    op.drop_constraint(_STATUS_CONSTRAINT, "quiz_variant_sets", type_="check")
    op.create_check_constraint(
        _STATUS_CONSTRAINT,
        "quiz_variant_sets",
        _STATUS_WITH_DIRTY,
    )


def downgrade() -> None:
    # DIRTY has no equivalent in the previous schema. FAILED is the safest
    # downgrade because it continues to block delivery and publication.
    op.execute("UPDATE quiz_variant_sets SET status = 'FAILED' WHERE status = 'DIRTY'")
    op.drop_constraint(_STATUS_CONSTRAINT, "quiz_variant_sets", type_="check")
    op.create_check_constraint(
        _STATUS_CONSTRAINT,
        "quiz_variant_sets",
        _STATUS_WITHOUT_DIRTY,
    )
