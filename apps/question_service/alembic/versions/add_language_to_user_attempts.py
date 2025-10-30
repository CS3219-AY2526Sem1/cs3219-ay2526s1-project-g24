"""Add language column to user_question_attempts

Revision ID: c1d2e3f4a5b6
Revises: aab900a767fa
Create Date: 2025-10-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'aab900a767fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add language column to track which language was used for the attempt."""
    # Add language column (nullable initially for existing data)
    op.add_column(
        'user_question_attempts',
        sa.Column('language', sa.String(50), nullable=True)
    )
    
    # Set default language for existing records (optional - could be 'python')
    op.execute("UPDATE user_question_attempts SET language = 'python' WHERE language IS NULL")
    
    # Make it non-nullable going forward
    op.alter_column('user_question_attempts', 'language', nullable=False)
    
    # Add index for better query performance when filtering by question_id + language
    op.create_index(
        'ix_user_attempts_question_language',
        'user_question_attempts',
        ['question_id', 'language']
    )


def downgrade() -> None:
    """Remove language column."""
    op.drop_index('ix_user_attempts_question_language', table_name='user_question_attempts')
    op.drop_column('user_question_attempts', 'language')
