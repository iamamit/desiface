import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.comment import Comment
from app.models.connection import Connection
from app.models.like import Like
from app.models.notification import Notification
from app.models.post import Post
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.post import CommentCreate, CommentOut, PostCreate, PostOut

router = APIRouter(prefix="/posts", tags=["posts"])


def _serialize_post(post: Post, me: User, db: Session) -> PostOut:
    like_count = len(post.likes)
    comment_count = len(post.comments)
    liked_by_me = any(l.user_id == me.id for l in post.likes)
    return PostOut(
        id=post.id,
        content=post.content,
        created_at=post.created_at,
        author=post.author,
        like_count=like_count,
        comment_count=comment_count,
        liked_by_me=liked_by_me,
    )


@router.get("/feed", response_model=list[PostOut])
def get_feed(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accepted = db.query(Connection).filter(
        Connection.status == "accepted",
        or_(
            Connection.requester_id == current_user.id,
            Connection.addressee_id == current_user.id,
        ),
    ).all()

    friend_ids = set()
    for c in accepted:
        friend_ids.add(c.requester_id if c.addressee_id == current_user.id else c.addressee_id)
    friend_ids.add(current_user.id)

    posts = (
        db.query(Post)
        .filter(Post.user_id.in_(friend_ids))
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_serialize_post(p, current_user, db) for p in posts]


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(payload: PostCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Post content cannot be empty")
    post = Post(user_id=current_user.id, content=payload.content.strip())
    db.add(post)
    db.commit()
    db.refresh(post)
    return _serialize_post(post, current_user, db)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    db.delete(post)
    db.commit()


@router.post("/{post_id}/like", response_model=dict)
def toggle_like(post_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    existing = db.query(Like).filter(Like.user_id == current_user.id, Like.post_id == post_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"liked": False}

    like = Like(user_id=current_user.id, post_id=post_id)
    db.add(like)

    if post.user_id != current_user.id:
        notif = Notification(
            user_id=post.user_id,
            actor_id=current_user.id,
            type="like",
            entity_id=post_id,
        )
        db.add(notif)

    db.commit()
    return {"liked": True}


@router.get("/{post_id}/comments", response_model=list[CommentOut])
def get_comments(post_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at).all()


@router.post("/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: uuid.UUID,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    comment = Comment(user_id=current_user.id, post_id=post_id, content=payload.content.strip())
    db.add(comment)

    if post.user_id != current_user.id:
        notif = Notification(
            user_id=post.user_id,
            actor_id=current_user.id,
            type="comment",
            entity_id=post_id,
        )
        db.add(notif)

    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.user_id == current_user.id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    db.delete(comment)
    db.commit()
