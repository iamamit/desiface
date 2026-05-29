import os
import re
import uuid
from collections import Counter

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.comment import Comment
from app.models.connection import Connection
from app.models.like import Like
from app.models.notification import Notification
from app.models.post import Post
from app.models.saved_post import SavedPost
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.post import (
    CommentCreate,
    CommentOut,
    PostCreate,
    PostEdit,
    PostOut,
    ReactionCreate,
    ReactionSummary,
)

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

VALID_TAGS = {
    "visa", "legal", "finance", "tax", "career",
    "teaching", "language", "housing", "tech",
    "networking", "cultural", "general",
}

VALID_REACTIONS = {"like", "love", "celebrate", "insightful", "funny"}

router = APIRouter(prefix="/posts", tags=["posts"])


def _parse_mentions(content: str, db: Session) -> list[User]:
    usernames = re.findall(r"@(\w+)", content)
    if not usernames:
        return []
    return db.query(User).filter(User.username.in_(set(usernames))).all()


def _serialize_post(post: Post, me: User, db: Session) -> PostOut:
    reaction_counts = Counter(l.reaction_type for l in post.likes)
    reactions = [ReactionSummary(type=t, count=c) for t, c in reaction_counts.most_common()]
    like_count = len(post.likes)
    my_like = next((l for l in post.likes if l.user_id == me.id), None)
    liked_by_me = my_like is not None
    my_reaction = my_like.reaction_type if my_like else None

    top_comments = [c for c in post.comments if c.parent_id is None]
    comment_count = len(post.comments)

    saved_by_me = db.query(SavedPost).filter(
        SavedPost.user_id == me.id, SavedPost.post_id == post.id
    ).first() is not None

    return PostOut(
        id=post.id,
        content=post.content,
        image_url=post.image_url,
        visibility=post.visibility,
        tag=post.tag,
        shared_post=post.shared_post,
        created_at=post.created_at,
        author=post.author,
        like_count=like_count,
        comment_count=comment_count,
        liked_by_me=liked_by_me,
        my_reaction=my_reaction,
        reactions=reactions,
        saved_by_me=saved_by_me,
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
        .filter(
            Post.user_id.in_(friend_ids),
            or_(Post.visibility == "public", Post.user_id == current_user.id),
        )
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_serialize_post(p, current_user, db) for p in posts]


@router.get("/saved", response_model=list[PostOut])
def get_saved_posts(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = (
        db.query(SavedPost)
        .filter(SavedPost.user_id == current_user.id)
        .order_by(SavedPost.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_serialize_post(s.post, current_user, db) for s in saved]


@router.post("/upload", response_model=dict)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    allowed = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, and WebP images are allowed")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    with open(path, "wb") as f:
        f.write(contents)
    return {"url": f"/uploads/{filename}"}


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(payload: PostCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.content.strip() and not payload.image_url and not payload.shared_post_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Post content cannot be empty")
    VALID_TAGS = {
        "visa", "legal", "finance", "tax", "career",
        "teaching", "language", "housing", "tech",
        "networking", "cultural", "general",
    }
    post = Post(
        user_id=current_user.id,
        content=payload.content.strip(),
        image_url=payload.image_url,
        shared_post_id=payload.shared_post_id,
        visibility=payload.visibility if payload.visibility in ("public", "friends") else "public",
        tag=payload.tag if payload.tag in VALID_TAGS else None,
    )
    db.add(post)
    db.flush()

    # mention notifications
    for mentioned in _parse_mentions(payload.content, db):
        if mentioned.id != current_user.id:
            db.add(Notification(user_id=mentioned.id, actor_id=current_user.id, type="mention", entity_id=post.id))

    db.commit()
    db.refresh(post)
    return _serialize_post(post, current_user, db)


@router.patch("/{post_id}", response_model=PostOut)
def edit_post(
    post_id: uuid.UUID,
    payload: PostEdit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    post.content = payload.content.strip()
    post.tag = payload.tag if payload.tag in VALID_TAGS else None
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


@router.post("/{post_id}/react", response_model=dict)
def toggle_reaction(
    post_id: uuid.UUID,
    payload: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    reaction_type = payload.reaction_type if payload.reaction_type in VALID_REACTIONS else "like"
    existing = db.query(Like).filter(Like.user_id == current_user.id, Like.post_id == post_id).first()

    if existing:
        if existing.reaction_type == reaction_type:
            # same reaction → unreact
            db.delete(existing)
            db.commit()
            return {"reacted": False, "reaction_type": None}
        else:
            # switch reaction
            existing.reaction_type = reaction_type
            db.commit()
            return {"reacted": True, "reaction_type": reaction_type}

    like = Like(user_id=current_user.id, post_id=post_id, reaction_type=reaction_type)
    db.add(like)

    if post.user_id != current_user.id:
        db.add(Notification(user_id=post.user_id, actor_id=current_user.id, type="like", entity_id=post_id))

    db.commit()
    return {"reacted": True, "reaction_type": reaction_type}


# keep backward-compatible /like endpoint
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

    like = Like(user_id=current_user.id, post_id=post_id, reaction_type="like")
    db.add(like)

    if post.user_id != current_user.id:
        db.add(Notification(user_id=post.user_id, actor_id=current_user.id, type="like", entity_id=post_id))

    db.commit()
    return {"liked": True}


@router.post("/{post_id}/save", response_model=dict)
def toggle_save(post_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    existing = db.query(SavedPost).filter(SavedPost.user_id == current_user.id, SavedPost.post_id == post_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"saved": False}

    db.add(SavedPost(user_id=current_user.id, post_id=post_id))
    db.commit()
    return {"saved": True}


@router.get("/{post_id}/comments", response_model=list[CommentOut])
def get_comments(post_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    # return only top-level comments; replies are nested inside each CommentOut
    top = db.query(Comment).filter(Comment.post_id == post_id, Comment.parent_id == None).order_by(Comment.created_at).all()  # noqa: E711
    return top


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

    if payload.parent_id:
        parent = db.query(Comment).filter(Comment.id == payload.parent_id, Comment.post_id == post_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent comment not found")

    comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        content=payload.content.strip(),
        parent_id=payload.parent_id,
    )
    db.add(comment)
    db.flush()

    # notify post author on top-level comments
    if not payload.parent_id and post.user_id != current_user.id:
        db.add(Notification(user_id=post.user_id, actor_id=current_user.id, type="comment", entity_id=post_id))

    # mention notifications in comments
    for mentioned in _parse_mentions(payload.content, db):
        if mentioned.id != current_user.id:
            db.add(Notification(user_id=mentioned.id, actor_id=current_user.id, type="mention", entity_id=post_id))

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
