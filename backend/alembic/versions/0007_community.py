"""community services and programs tables

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-28
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "services",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("is_paid", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("price_info", sa.String(100), nullable=True),
        sa.Column("mode", sa.String(20), nullable=False, server_default="remote"),
        sa.Column("location", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "programs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("event_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_online", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("location", sa.String(200), nullable=True),
        sa.Column("capacity", sa.Integer, nullable=True),
        sa.Column("is_free", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("price_info", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "program_rsvps",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("program_id", UUID(as_uuid=True), sa.ForeignKey("programs.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("program_id", "user_id", name="uq_program_rsvp"),
    )


def downgrade() -> None:
    op.drop_table("program_rsvps")
    op.drop_table("programs")
    op.drop_table("services")
