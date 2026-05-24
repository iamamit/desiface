"""add image_url to posts

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-25
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("posts", sa.Column("image_url", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("posts", "image_url")
