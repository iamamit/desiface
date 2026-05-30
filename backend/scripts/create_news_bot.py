"""One-time script to create the @desiface_news bot user.

Run from /app/backend:
    python -m scripts.create_news_bot
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User


def main():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "desiface_news").first()
        if existing:
            print(f"Bot user already exists: id={existing.id}")
            return

        bot = User(
            email="news@desiface.internal",
            username="desiface_news",
            full_name="Desiface News",
            bio="Daily news and updates for Indians in Germany — curated automatically every morning.",
            headline="Your daily dose of India-Germany news 🇮🇳🇩🇪",
            location="Germany",
            is_verified=True,
            is_active=True,
        )
        db.add(bot)
        db.commit()
        db.refresh(bot)
        print(f"Created news bot: id={bot.id}, username={bot.username}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
