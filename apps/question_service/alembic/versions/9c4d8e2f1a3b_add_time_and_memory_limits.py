"""add time and memory limits to questions

Revision ID: 9c4d8e2f1a3b
Revises: 8b57167f590e
Create Date: 2025-10-16 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9c4d8e2f1a3b'
down_revision = '8b57167f590e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add time_limit and memory_limit columns to questions table
    op.add_column('questions', sa.Column('time_limit', sa.Integer(), nullable=False, server_default='5'))
    op.add_column('questions', sa.Column('memory_limit', sa.Integer(), nullable=False, server_default='128000'))
    
    # Remove server defaults after adding the columns (so future inserts require explicit values)
    op.alter_column('questions', 'time_limit', server_default=None)
    op.alter_column('questions', 'memory_limit', server_default=None)


def downgrade() -> None:
    # Remove the columns
    op.drop_column('questions', 'memory_limit')
    op.drop_column('questions', 'time_limit')
