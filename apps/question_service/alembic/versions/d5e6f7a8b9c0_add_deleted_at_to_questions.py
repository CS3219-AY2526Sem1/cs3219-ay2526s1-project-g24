"""Add deleted_at column to questions

Revision ID: d5e6f7a8b9c0
Revises: 9c5452cf8705
Create Date: 2025-10-30 23:50:00.000000

"""

from typing import Sequence, Union
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, Sequence[str], None] = '9c5452cf8705'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op migration to merge soft delete history branches."""
    # This revision exists to linearise the migration history after
    # a duplicate soft-delete migration landed on another branch.
    # No schema changes are required because the preceding revision
    pass


def downgrade() -> None:
    """Remove deleted_at column."""
    op.drop_column('questions', 'deleted_at')
