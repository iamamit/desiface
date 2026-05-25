import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_post_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="SET NULL"), nullable=True)
    visibility: Mapped[str] = mapped_column(String(20), nullable=False, default="public")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", foreign_keys=[user_id])
    shared_post = relationship("Post", foreign_keys=[shared_post_id], remote_side="Post.id")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan", order_by="Comment.created_at")
