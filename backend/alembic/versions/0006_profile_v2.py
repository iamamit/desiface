"""phase 2 profile fields

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("cover_url", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("headline", sa.String(220), nullable=True))
    op.add_column("users", sa.Column("location", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("work_experience", JSONB, nullable=True))
    op.add_column("users", sa.Column("education", JSONB, nullable=True))
    op.add_column("users", sa.Column("skills", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("users", "skills")
    op.drop_column("users", "education")
    op.drop_column("users", "work_experience")
    op.drop_column("users", "location")
    op.drop_column("users", "headline")
    op.drop_column("users", "cover_url")
