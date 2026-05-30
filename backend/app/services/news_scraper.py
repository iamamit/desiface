import logging
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import feedparser

from app.core.database import SessionLocal
from app.models.connection import Connection
from app.models.post import Post
from app.models.user import User

logger = logging.getLogger(__name__)

NEWS_BOT_USERNAME = "desiface_news"

RSS_FEEDS = [
    "https://news.google.com/rss/search?q=Indians+Germany&hl=en&gl=DE&ceid=DE:en",
    "https://news.google.com/rss/search?q=Indian+community+Germany&hl=en&gl=DE&ceid=DE:en",
    "https://news.google.com/rss/search?q=desi+events+Germany&hl=en&gl=DE&ceid=DE:en",
    "https://news.google.com/rss/search?q=India+Germany+diaspora&hl=en&gl=DE&ceid=DE:en",
]

MAX_POSTS_PER_RUN = 8
DEDUP_WINDOW_DAYS = 14


def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&quot;", '"', text)
    text = re.sub(r"&#39;", "'", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _source_name(url: str) -> str:
    try:
        host = urlparse(url).netloc
        return host.replace("www.", "")
    except Exception:
        return ""


def _already_posted(content: str, seen_urls: set[str]) -> bool:
    for word in content.split():
        if word.startswith("http") and word in seen_urls:
            return True
    return False


def run_news_scraper() -> int:
    db = SessionLocal()
    try:
        bot = db.query(User).filter(User.username == NEWS_BOT_USERNAME).first()
        if not bot:
            logger.warning("News bot user '%s' not found — skipping scrape", NEWS_BOT_USERNAME)
            return 0

        cutoff = datetime.now(timezone.utc) - timedelta(days=DEDUP_WINDOW_DAYS)
        recent_posts = (
            db.query(Post)
            .filter(Post.user_id == bot.id, Post.created_at > cutoff)
            .all()
        )

        seen_urls: set[str] = set()
        for p in recent_posts:
            for word in p.content.split():
                if word.startswith("http"):
                    seen_urls.add(word.strip(".,)"))

        created = 0
        for feed_url in RSS_FEEDS:
            if created >= MAX_POSTS_PER_RUN:
                break
            try:
                feed = feedparser.parse(feed_url)
            except Exception as exc:
                logger.error("Failed to fetch feed %s: %s", feed_url, exc)
                continue

            for entry in feed.entries:
                if created >= MAX_POSTS_PER_RUN:
                    break

                url = entry.get("link", "").strip()
                if not url or url in seen_urls:
                    continue

                title = _strip_html(entry.get("title", "")).strip()
                summary = _strip_html(entry.get("summary", "")).strip()
                summary = summary[:250] + "…" if len(summary) > 250 else summary
                source = entry.get("source", {}).get("title", "") or _source_name(url)

                if not title:
                    continue

                # Google News RSS summaries are usually "Title  Source" — skip them
                clean_summary = summary
                if title.lower()[:40] in clean_summary.lower():
                    clean_summary = ""

                lines = [f"📰 {title}"]
                if clean_summary:
                    lines.append(f"\n{clean_summary}")
                if source:
                    lines.append(f"\n🔗 {source}")
                lines.append(url)

                content = "\n".join(lines)

                post = Post(
                    user_id=bot.id,
                    content=content,
                    visibility="public",
                    tag="news",
                )
                db.add(post)
                seen_urls.add(url)
                created += 1

        db.commit()
        logger.info("News scraper: created %d posts", created)
        return created

    except Exception as exc:
        logger.exception("News scraper failed: %s", exc)
        db.rollback()
        return 0
    finally:
        db.close()


def auto_connect_to_news_bot(user_id, db) -> None:
    """Call this when a new user is created to connect them to the news bot."""
    bot = db.query(User).filter(User.username == NEWS_BOT_USERNAME).first()
    if not bot or bot.id == user_id:
        return

    existing = (
        db.query(Connection)
        .filter(
            Connection.requester_id.in_([user_id, bot.id]),
            Connection.addressee_id.in_([user_id, bot.id]),
        )
        .first()
    )
    if existing:
        return

    db.add(Connection(
        requester_id=bot.id,
        addressee_id=user_id,
        status="accepted",
    ))
