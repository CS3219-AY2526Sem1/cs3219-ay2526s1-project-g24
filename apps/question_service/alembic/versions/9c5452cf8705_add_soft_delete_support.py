"""add soft delete support

Revision ID: 9c5452cf8705
Revises: c1d2e3f4a5b6
Create Date: 2025-10-30 01:31:38.079382

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9c5452cf8705'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add deleted_at column to questions table for soft delete support."""
    op.add_column('questions', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_questions_deleted_at'), 'questions', ['deleted_at'], unique=False)


def downgrade() -> None:
    """Remove deleted_at column from questions table."""
    op.drop_index(op.f('ix_questions_deleted_at'), table_name='questions')
    op.drop_column('questions', 'deleted_at')
