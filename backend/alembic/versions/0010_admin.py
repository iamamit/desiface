"""admin role and error_logs table

Revision ID: 0010_admin
Revises: 0009_functional_features
Create Date: 2026-05-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False, server_default="false"))

    op.create_table(
        "error_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("method", sa.String(10), nullable=False),
        sa.Column("path", sa.String(500), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("query_params", sa.Text(), nullable=True),
    )
    op.create_index("ix_error_logs_timestamp", "error_logs", ["timestamp"])
    op.create_index("ix_error_logs_status_code", "error_logs", ["status_code"])


def downgrade() -> None:
    op.drop_index("ix_error_logs_status_code", table_name="error_logs")
    op.drop_index("ix_error_logs_timestamp", table_name="error_logs")
    op.drop_table("error_logs")
    op.drop_column("users", "is_admin")
