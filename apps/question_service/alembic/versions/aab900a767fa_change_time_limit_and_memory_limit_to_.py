"""Change time_limit and memory_limit to JSON for per-language values

Revision ID: aab900a767fa
Revises: 9c4d8e2f1a3b
Create Date: 2025-10-17 17:34:18.389543

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision: str = 'aab900a767fa'
down_revision: Union[str, Sequence[str], None] = '9c4d8e2f1a3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - convert INTEGER columns to JSON with per-language values."""
    # Step 1: Add temporary JSON columns
    op.add_column('questions', sa.Column('time_limit_json', JSON, nullable=True))
    op.add_column('questions', sa.Column('memory_limit_json', JSON, nullable=True))
    
    # Step 2: Migrate data from INTEGER to JSON format
    # Convert existing integer values to JSON with per-language defaults
    # For memory: Java needs ~2x, C++ needs ~0.75x of base value
    op.execute("""
        UPDATE questions 
        SET time_limit_json = jsonb_build_object(
            'python', LEAST(time_limit + 1, time_limit * 1.5)::int,
            'javascript', LEAST(time_limit + 1, time_limit * 1.5)::int,
            'java', GREATEST(time_limit + 3, time_limit * 2)::int,
            'cpp', time_limit::int
        ),
        memory_limit_json = jsonb_build_object(
            'python', memory_limit::int,
            'javascript', memory_limit::int,
            'java', GREATEST(96000, (memory_limit * 1.5)::int),
            'cpp', LEAST((memory_limit * 0.75)::int, memory_limit)::int
        )
        WHERE time_limit IS NOT NULL AND memory_limit IS NOT NULL
    """)
    
    # Step 3: Drop old INTEGER columns
    op.drop_column('questions', 'time_limit')
    op.drop_column('questions', 'memory_limit')
    
    # Step 4: Rename JSON columns to original names
    op.alter_column('questions', 'time_limit_json', new_column_name='time_limit')
    op.alter_column('questions', 'memory_limit_json', new_column_name='memory_limit')
    
    # Step 5: Make columns NOT NULL
    op.alter_column('questions', 'time_limit', nullable=False)
    op.alter_column('questions', 'memory_limit', nullable=False)


def downgrade() -> None:
    """Downgrade schema - convert JSON back to INTEGER (loses per-language data)."""
    # Add temporary INTEGER columns
    op.add_column('questions', sa.Column('time_limit_int', sa.INTEGER(), nullable=True))
    op.add_column('questions', sa.Column('memory_limit_int', sa.INTEGER(), nullable=True))
    
    # Extract Python values as the default (or use max of all languages)
    op.execute("""
        UPDATE questions 
        SET time_limit_int = (time_limit->>'python')::int,
            memory_limit_int = (memory_limit->>'python')::int
        WHERE time_limit IS NOT NULL AND memory_limit IS NOT NULL
    """)
    
    # Drop JSON columns
    op.drop_column('questions', 'time_limit')
    op.drop_column('questions', 'memory_limit')
    
    # Rename INTEGER columns back
    op.alter_column('questions', 'time_limit_int', new_column_name='time_limit')
    op.alter_column('questions', 'memory_limit_int', new_column_name='memory_limit')
    
    # Make columns NOT NULL
    op.alter_column('questions', 'time_limit', nullable=False)
    op.alter_column('questions', 'memory_limit', nullable=False)
