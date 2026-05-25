"""phase1 completion: sharing, visibility, password reset, email verification

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-25
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    # Post sharing + visibility
    op.add_column("posts", sa.Column("shared_post_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("posts.id", ondelete="SET NULL"), nullable=True))
    op.add_column("posts", sa.Column("visibility", sa.String(20), nullable=False, server_default="public"))
    op.create_check_constraint("ck_post_visibility", "posts", "visibility IN ('public', 'friends')")

    # User profile visibility
    op.add_column("users", sa.Column("profile_visibility", sa.String(20), nullable=False, server_default="public"))
    op.create_check_constraint("ck_profile_visibility", "users", "profile_visibility IN ('public', 'friends_only')")

    # Password reset tokens
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token", sa.String(255), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_password_reset_tokens_token", "password_reset_tokens", ["token"])

    # Email verification tokens
    op.create_table(
        "email_verification_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token", sa.String(255), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_email_verification_tokens_token", "email_verification_tokens", ["token"])


def downgrade():
    op.drop_table("email_verification_tokens")
    op.drop_table("password_reset_tokens")
    op.drop_constraint("ck_profile_visibility", "users", type_="check")
    op.drop_column("users", "profile_visibility")
    op.drop_constraint("ck_post_visibility", "posts", type_="check")
    op.drop_column("posts", "visibility")
    op.drop_column("posts", "shared_post_id")
