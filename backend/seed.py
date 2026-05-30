"""
Seed script — run inside the backend container:
  docker compose exec backend python seed.py
"""
import uuid
from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models.connection import Connection
from app.models.message import Message
from app.models.notification import Notification
from app.models.post import Post
from app.models.comment import Comment
from app.models.like import Like

AMIT_ID = uuid.UUID("e643256d-48d8-4b14-96bd-6cc8590e6f0f")

# ── Fake users ──────────────────────────────────────────────────────────────
USERS = [
    dict(
        username="priya_sharma",
        email="priya.sharma@seed.dev",
        full_name="Priya Sharma",
        headline="Senior Software Engineer @ SAP",
        location="Walldorf, Germany",
        bio="Building enterprise software. Originally from Pune, now loving Heidelberg.",
        skills=["Python", "Java", "Cloud Architecture", "SAP BTP"],
        work_experience=[{"title": "Senior Software Engineer", "company": "SAP SE", "start_date": "2021-03", "end_date": None, "current": True, "description": "Working on SAP Business Technology Platform."}],
        education=[{"school": "Pune University", "degree": "B.E.", "field": "Computer Engineering", "start_date": "2013-08", "end_date": "2017-05"}],
    ),
    dict(
        username="rohan_mehta",
        email="rohan.mehta@seed.dev",
        full_name="Rohan Mehta",
        headline="Product Manager @ Zalando",
        location="Berlin, Germany",
        bio="Desi Berliner. Obsessed with customer experience and great products.",
        skills=["Product Strategy", "Agile", "Data Analysis", "UX Research"],
        work_experience=[{"title": "Product Manager", "company": "Zalando SE", "start_date": "2020-06", "end_date": None, "current": True, "description": None}],
        education=[{"school": "IIM Ahmedabad", "degree": "MBA", "field": "Marketing", "start_date": "2017-06", "end_date": "2019-05"}],
    ),
    dict(
        username="ananya_krishnan",
        email="ananya.krishnan@seed.dev",
        full_name="Ananya Krishnan",
        headline="Data Scientist @ BMW Group",
        location="Munich, Germany",
        bio="Turning data into decisions. Tamil Nadu roots, Bavarian heart.",
        skills=["Machine Learning", "Python", "SQL", "TensorFlow", "Power BI"],
        work_experience=[{"title": "Data Scientist", "company": "BMW Group", "start_date": "2022-01", "end_date": None, "current": True, "description": "Working on predictive maintenance models for EVs."}],
        education=[{"school": "IIT Madras", "degree": "M.Tech", "field": "AI & Data Science", "start_date": "2018-07", "end_date": "2020-06"}],
    ),
    dict(
        username="vikram_nair",
        email="vikram.nair@seed.dev",
        full_name="Vikram Nair",
        headline="DevOps Engineer @ Deutsche Telekom",
        location="Bonn, Germany",
        bio="Infrastructure guy. Kubernetes by day, cricket by evening.",
        skills=["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD"],
        work_experience=[{"title": "DevOps Engineer", "company": "Deutsche Telekom", "start_date": "2019-09", "end_date": None, "current": True, "description": None}],
        education=[{"school": "NIT Calicut", "degree": "B.Tech", "field": "Computer Science", "start_date": "2012-08", "end_date": "2016-06"}],
    ),
    dict(
        username="deepa_iyer",
        email="deepa.iyer@seed.dev",
        full_name="Deepa Iyer",
        headline="UX Designer @ Siemens",
        location="Erlangen, Germany",
        bio="Designing human-centered experiences. Bangalore born, Germany based.",
        skills=["Figma", "User Research", "Prototyping", "Design Systems"],
        work_experience=[{"title": "UX Designer", "company": "Siemens AG", "start_date": "2020-03", "end_date": None, "current": True, "description": "Designing interfaces for industrial automation software."}],
        education=[{"school": "National Institute of Design", "degree": "B.Des", "field": "UX Design", "start_date": "2014-07", "end_date": "2018-06"}],
    ),
    dict(
        username="arjun_bose",
        email="arjun.bose@seed.dev",
        full_name="Arjun Bose",
        headline="Full Stack Developer @ Delivery Hero",
        location="Berlin, Germany",
        bio="Kolkata boy in Berlin. Full stack dev, food enthusiast.",
        skills=["React", "Node.js", "PostgreSQL", "TypeScript", "GraphQL"],
        work_experience=[{"title": "Full Stack Developer", "company": "Delivery Hero", "start_date": "2021-08", "end_date": None, "current": True, "description": None}],
        education=[{"school": "Jadavpur University", "degree": "B.E.", "field": "Information Technology", "start_date": "2015-08", "end_date": "2019-06"}],
    ),
]

POSTS = [
    # priya_sharma posts
    ("priya_sharma", "Just hit 3 years at SAP! Time really flies when you're building things you love. Grateful for the amazing team and the opportunity to work in Germany. 🙏 #milestone #SAP #lifeinGermany"),
    ("priya_sharma", "Pro tip for Indians in Germany: always carry a Personalausweis copy — makes everything from renting a bike to opening a bank account so much smoother. Learnt this the hard way 😅"),
    ("priya_sharma", "The best thing about working in Walldorf? The work-life balance is real. 5pm and everyone actually leaves the office. Still not used to it after 3 years. 😄"),

    # rohan_mehta posts
    ("rohan_mehta", "Berlin is incredible for product people. The startup density here means you're always learning from someone doing something wild. If you're a PM thinking about Europe — Berlin should be on your list. 🇩🇪"),
    ("rohan_mehta", "Learnings from 4 years of PM at Zalando:\n\n1. Data is your best friend, but intuition built it first\n2. Alignment > speed\n3. Your customers don't care about your roadmap\n4. Ship, learn, repeat\n\nWhat would you add?"),
    ("rohan_mehta", "Diwali in Berlin last week was incredible. The Indian community here organised a proper celebration — lights, sweets, rangoli. Made me feel right at home. 🪔 Happy Diwali to everyone celebrating!"),

    # ananya_krishnan posts
    ("ananya_krishnan", "Excited to share that our team's predictive maintenance model is now live across 12 BMW plants. Reduced unplanned downtime by 23%. Months of work, worth every moment. 🚗⚡ #MachineLearning #BMW #EV"),
    ("ananya_krishnan", "If you're moving to Munich for work, here's my honest take after 2 years: expensive but worth it. Great public transport, beautiful parks, and the biergarten culture is something else 🍺. DMs open if you have questions!"),
    ("ananya_krishnan", "Just presented at PyData Munich on time-series forecasting for automotive manufacturing. Was nervous but the community was so welcoming. Slides in the comments. #Python #DataScience"),

    # vikram_nair posts
    ("vikram_nair", "Migrated our entire infrastructure to Kubernetes last quarter. Painful? Yes. Worth it? Absolutely. Deployments went from 45 minutes to under 3. If anyone's going through this journey, happy to share notes. #DevOps #K8s"),
    ("vikram_nair", "Cricket tip for Indians in Germany: there are more clubs than you think! Found a local T20 league in Cologne last month. We lost badly but it was the best Saturday I've had here 😂 #cricket #indiansingermany"),
    ("vikram_nair", "Applying for a German Blue Card was the best decision I made. If you're a tech professional here on a work permit, look into it — opens up a lot of doors for permanent residency. Happy to help if you have questions."),

    # deepa_iyer posts
    ("deepa_iyer", "Design systems save lives. Or at least save 6 hours of developer debate per sprint. Just finished building ours at Siemens and the velocity improvement is already visible. #DesignSystems #Figma #UX"),
    ("deepa_iyer", "Visited the Bauhaus Museum in Dessau last weekend and now I understand why German design is the way it is. Form follows function, but make it beautiful. Mind = blown. 🏛️ #design #inspiration"),
    ("deepa_iyer", "Looking for UX designers who've worked on industrial/enterprise software! Doing some research on design patterns in complex systems. Would love to connect and chat. Drop a comment or DM 👇"),

    # arjun_bose posts
    ("arjun_bose", "6 months into TypeScript after years of JavaScript. Honest review: the initial pain is real, but the confidence it gives you in large codebases is unmatched. Don't let anyone tell you it's not worth learning. #TypeScript #webdev"),
    ("arjun_bose", "Kali Puja in Berlin tonight! Organized a small puja with other Bengalis in the city. Nothing like celebrating home traditions abroad to remind you where you come from. 🌸 #kalipuja #bengali #berlin"),
    ("arjun_bose", "Hot take: GraphQL is overkill for 80% of apps. REST + a good schema is perfectly fine. The other 20% of cases where it shines are genuinely excellent though. Fight me. 👇"),
]

MESSAGES = [
    # conversation between amit and priya
    ("priya_sharma", "amit123", "Hey Amit! Saw your profile on Desiface. Fellow desi in Germany! Where are you based?"),
    ("amit123", "priya_sharma", "Hey Priya! I'm in Munich. You're in Walldorf right? That's not too far actually!"),
    ("priya_sharma", "amit123", "Yes exactly! We should grab lunch sometime. The Indian community here is great but always nice to meet more people."),
    ("amit123", "priya_sharma", "Absolutely! There's a great South Indian place in Munich if you're ever this way. Let me know!"),
    ("priya_sharma", "amit123", "Oh that sounds amazing. I'm in Munich next week for a conference. I'll ping you!"),

    # conversation between amit and rohan
    ("rohan_mehta", "amit123", "Amit bhai, saw you're also in tech! What stack are you working with these days?"),
    ("amit123", "rohan_mehta", "Hey Rohan! Mostly React + FastAPI these days. You're at Zalando right? Love their tech blog."),
    ("rohan_mehta", "amit123", "Yes! We use a lot of micro-frontends. Happy to chat more about the setup if you're curious."),
    ("amit123", "rohan_mehta", "That would be awesome, I'm looking into that for a project. Maybe a quick call sometime?"),
]


def now_minus(minutes: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(minutes=minutes)


def run():
    db = SessionLocal()
    try:
        from app.models.user import User

        # ── Create users ──────────────────────────────────────────────────
        user_map: dict[str, User] = {}

        # Fetch amit
        amit = db.query(User).filter(User.id == AMIT_ID).first()
        if not amit:
            print("ERROR: Amit not found in DB")
            return
        user_map["amit123"] = amit
        print(f"Found Amit: {amit.email}")

        for u in USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                user_map[u["username"]] = existing
                print(f"Existing user: {u['username']}")
                continue

            new_user = User(
                id=uuid.uuid4(),
                email=u["email"],
                username=u["username"],
                full_name=u["full_name"],
                headline=u.get("headline"),
                location=u.get("location"),
                bio=u.get("bio"),
                skills=u.get("skills"),
                work_experience=u.get("work_experience"),
                education=u.get("education"),
                is_active=True,
                is_verified=True,
                profile_visibility="public",
            )
            db.add(new_user)
            user_map[u["username"]] = new_user
            print(f"Created user: {u['username']}")

        db.flush()

        # ── Connections ───────────────────────────────────────────────────
        # priya, rohan, ananya, vikram = accepted connections with Amit
        # deepa = pending request TO Amit
        # arjun = pending request FROM Amit

        accepted = ["priya_sharma", "rohan_mehta", "ananya_krishnan", "vikram_nair"]
        for uname in accepted:
            other = user_map[uname]
            existing = db.query(Connection).filter(
                ((Connection.requester_id == AMIT_ID) & (Connection.addressee_id == other.id)) |
                ((Connection.requester_id == other.id) & (Connection.addressee_id == AMIT_ID))
            ).first()
            if not existing:
                conn = Connection(requester_id=other.id, addressee_id=AMIT_ID, status="accepted")
                db.add(conn)
                print(f"Connected: {uname} <-> amit123")

        # deepa sends a pending request to amit
        deepa = user_map["deepa_iyer"]
        if not db.query(Connection).filter(
            ((Connection.requester_id == deepa.id) & (Connection.addressee_id == AMIT_ID)) |
            ((Connection.requester_id == AMIT_ID) & (Connection.addressee_id == deepa.id))
        ).first():
            conn = Connection(requester_id=deepa.id, addressee_id=AMIT_ID, status="pending")
            db.add(conn)
            db.flush()
            notif = Notification(user_id=AMIT_ID, actor_id=deepa.id, type="connection_request", entity_id=conn.id)
            db.add(notif)
            print("Pending request from deepa_iyer to amit123")

        # arjun: amit sent a pending request
        arjun = user_map["arjun_bose"]
        if not db.query(Connection).filter(
            ((Connection.requester_id == AMIT_ID) & (Connection.addressee_id == arjun.id)) |
            ((Connection.requester_id == arjun.id) & (Connection.addressee_id == AMIT_ID))
        ).first():
            conn = Connection(requester_id=AMIT_ID, addressee_id=arjun.id, status="pending")
            db.add(conn)
            print("Pending request from amit123 to arjun_bose")

        db.flush()

        # ── Posts ─────────────────────────────────────────────────────────
        offset = 0
        for uname, content in POSTS:
            author = user_map[uname]
            existing = db.query(Post).filter(
                Post.user_id == author.id, Post.content == content
            ).first()
            if not existing:
                p = Post(
                    id=uuid.uuid4(),
                    user_id=author.id,
                    content=content,
                    created_at=now_minus(offset * 17 + 5),
                )
                db.add(p)
                offset += 1

                # Like some posts with Amit's account
                if offset % 2 == 0:
                    db.flush()
                    like = Like(user_id=AMIT_ID, post_id=p.id)
                    db.add(like)

                # Add a comment from Amit on first post of each user
                if offset <= len(USERS):
                    db.flush()
                    comment = Comment(
                        user_id=AMIT_ID,
                        post_id=p.id,
                        content="Great perspective! This really resonates with my experience too. 👍",
                        created_at=now_minus(offset * 17),
                    )
                    db.add(comment)
                    notif = Notification(
                        user_id=author.id, actor_id=AMIT_ID,
                        type="comment", entity_id=p.id
                    )
                    db.add(notif)

        db.flush()

        # ── Messages ──────────────────────────────────────────────────────
        msg_offset = 0
        for sender_uname, receiver_uname, content in MESSAGES:
            sender = user_map[sender_uname]
            receiver = user_map[receiver_uname]
            existing = db.query(Message).filter(
                Message.sender_id == sender.id,
                Message.receiver_id == receiver.id,
                Message.content == content,
            ).first()
            if not existing:
                is_read = receiver_uname != "amit123"  # unread if amit is receiver
                m = Message(
                    id=uuid.uuid4(),
                    sender_id=sender.id,
                    receiver_id=receiver.id,
                    content=content,
                    is_read=is_read,
                    created_at=now_minus(120 - msg_offset * 5),
                )
                db.add(m)
                msg_offset += 1

        db.commit()
        print("\n✅ Seed complete!")
        print(f"  Users: {len(USERS)} created/found")
        print(f"  Connections: 4 accepted, 1 pending in, 1 pending out")
        print(f"  Posts: {len(POSTS)}")
        print(f"  Messages: {len(MESSAGES)}")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run()
