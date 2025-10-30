"""Add deleted_at column to questions

Revision ID: d5e6f7a8b9c0
Revises: c1d2e3f4a5b6
Create Date: 2025-10-30 23:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add deleted_at column for soft deletes."""
    op.add_column('questions', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Remove deleted_at column."""
    op.drop_column('questions', 'deleted_at')
