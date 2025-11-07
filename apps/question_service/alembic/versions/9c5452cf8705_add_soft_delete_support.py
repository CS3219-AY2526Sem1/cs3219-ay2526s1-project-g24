"""add soft delete support

Revision ID: 9c5452cf8705
Revises: c1d2e3f4a5b6
Create Date: 2025-10-30 01:31:38.079382

"""
import sqlalchemy as sa
from alembic import op
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '9c5452cf8705'
down_revision: Union[str, Sequence[str], None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add supporting index for soft delete queries."""
    op.create_index(op.f('ix_questions_deleted_at'), 'questions', ['deleted_at'], unique=False)


def downgrade() -> None:
    """Remove supporting index for soft delete queries."""
    op.drop_index(op.f('ix_questions_deleted_at'), table_name='questions')
