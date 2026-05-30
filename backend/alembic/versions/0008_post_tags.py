"""add tag column to posts

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-28
"""

import sqlalchemy as sa
from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("posts", sa.Column("tag", sa.String(30), nullable=True))


def downgrade() -> None:
    op.drop_column("posts", "tag")
