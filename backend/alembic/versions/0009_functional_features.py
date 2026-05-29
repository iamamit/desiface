"""functional features: saved posts, reactions, comment replies, jobs, groups

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-29
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # reaction_type on likes (default 'like' keeps existing data valid)
    op.add_column("likes", sa.Column("reaction_type", sa.String(20), nullable=False, server_default="like"))

    # parent_id on comments for threaded replies
    op.add_column("comments", sa.Column("parent_id", UUID(as_uuid=True), sa.ForeignKey("comments.id", ondelete="CASCADE"), nullable=True))
    op.create_index("ix_comments_parent_id", "comments", ["parent_id"])

    # saved_posts
    op.create_table(
        "saved_posts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("post_id", UUID(as_uuid=True), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "post_id", name="uq_saved_user_post"),
    )
    op.create_index("ix_saved_posts_user_id", "saved_posts", ["user_id"])

    # jobs
    op.create_table(
        "jobs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("company", sa.String(120), nullable=False),
        sa.Column("location", sa.String(120), nullable=True),
        sa.Column("employment_type", sa.String(30), nullable=False, server_default="full_time"),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("requirements", sa.Text, nullable=True),
        sa.Column("is_remote", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("salary_range", sa.String(80), nullable=True),
        sa.Column("apply_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # groups
    op.create_table(
        "groups",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String(50), nullable=False, server_default="general"),
        sa.Column("is_private", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("cover_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # group_members
    op.create_table(
        "group_members",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("group_id", UUID(as_uuid=True), sa.ForeignKey("groups.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="member"),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("group_id", "user_id", name="uq_group_member"),
    )
    op.create_index("ix_group_members_group_id", "group_members", ["group_id"])
    op.create_index("ix_group_members_user_id", "group_members", ["user_id"])

    # group_posts (separate table so group posts don't pollute the main feed)
    op.create_table(
        "group_posts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("group_id", UUID(as_uuid=True), sa.ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("image_url", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("group_posts")
    op.drop_table("group_members")
    op.drop_table("groups")
    op.drop_table("jobs")
    op.drop_index("ix_saved_posts_user_id", "saved_posts")
    op.drop_table("saved_posts")
    op.drop_index("ix_comments_parent_id", "comments")
    op.drop_column("comments", "parent_id")
    op.drop_column("likes", "reaction_type")
