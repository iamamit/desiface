"""
Seed community services, programs, and tagged posts for local dev testing.
Run: docker compose exec backend python seed_community.py
"""
import uuid
from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models.post import Post
from app.models.program import Program, ProgramRSVP
from app.models.service import Service
from app.models.user import User

AMIT_USERNAME = "amit123"


def ts(days_ago=0, hours_ago=0):
    return datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)


def future(days=0, hours=0):
    return datetime.now(timezone.utc) + timedelta(days=days, hours=hours)


def run():
    db = SessionLocal()
    try:
        amit = db.query(User).filter(User.username == AMIT_USERNAME).first()
        if not amit:
            print("ERROR: amit123 not found — run seed.py first")
            return

        other_users = db.query(User).filter(User.username != AMIT_USERNAME).limit(10).all()
        if not other_users:
            print("ERROR: No other users found — run seed.py first")
            return

        u = {u.username: u for u in other_users}
        users = list(other_users)

        # ── Services ──────────────────────────────────────────────────────────
        services = [
            Service(id=uuid.uuid4(), user_id=amit.id,
                    category="visa", title="Blue Card & Visa Application Help",
                    description="I went through the Blue Card process myself and can guide you step by step — from document checklist to Ausländerbehörde appointment. Especially helpful for IT professionals. Happy to review your application before submission.",
                    is_paid=False, mode="remote", is_active=True),

            Service(id=uuid.uuid4(), user_id=users[0].id,
                    category="legal", title="German Employment Contract Review",
                    description="I'll review your German employment contract and flag any unusual clauses. Focus on notice periods, non-compete clauses, IP assignment, and overtime rules. Available in English.",
                    is_paid=True, price_info="€80 / review", mode="remote", is_active=True),

            Service(id=uuid.uuid4(), user_id=users[1].id,
                    category="tax", title="Indian + German Tax Filing Guidance",
                    description="Help with DTAA (Double Tax Avoidance Agreement) between India and Germany, NRI status, and how to handle Indian income while living in Germany. I've been doing this for 4 years.",
                    is_paid=True, price_info="€60/hour", mode="both", location="Munich", is_active=True),

            Service(id=uuid.uuid4(), user_id=users[2].id,
                    category="teaching", title="German Language Coaching (A1–B2)",
                    description="Personalised German lessons for professionals. Focus on workplace German, Behörde conversations, and daily life vocabulary. Sessions over Zoom, flexible timing including evenings.",
                    is_paid=True, price_info="€40/hour", mode="remote", is_active=True),

            Service(id=uuid.uuid4(), user_id=users[3].id,
                    category="career", title="Tech Interview Prep for German Companies",
                    description="Mock interviews, system design prep, and CV review tailored for German tech companies (SAP, BMW, Zalando, startups). I've been on both sides of the interview table.",
                    is_paid=False, mode="remote", is_active=True),

            Service(id=uuid.uuid4(), user_id=users[4].id,
                    category="finance", title="Indian Diaspora Investment & Remittance Planning",
                    description="Advice on NRE/NRO accounts, remittance strategies, and how to invest in India from Germany without tax headaches. Not a licensed advisor — sharing personal experience.",
                    is_paid=False, mode="remote", is_active=True),

            Service(id=uuid.uuid4(), user_id=users[5].id,
                    category="housing", title="Apartment Hunting Support — Berlin & Munich",
                    description="Finding a flat in Germany as a new arrival is tough. I'll help you craft a convincing Mietinteressentenbogen, translate documents, and review your rental contract before you sign.",
                    is_paid=False, mode="both", location="Berlin", is_active=True),

            Service(id=uuid.uuid4(), user_id=users[6].id,
                    category="career", title="LinkedIn & German CV Makeover",
                    description="German CVs are different — photo, Lebenslauf format, no fluff. I'll rewrite yours so it works for both German companies and international firms based here.",
                    is_paid=True, price_info="€50 flat", mode="remote", is_active=True),

            Service(id=uuid.uuid4(), user_id=users[7].id,
                    category="tech", title="Cloud Architecture Review (AWS / Azure / GCP)",
                    description="I'll review your cloud architecture and give actionable feedback on cost optimisation, security, and scalability. Particularly experienced with multi-cloud setups for European compliance.",
                    is_paid=True, price_info="€100/hour", mode="remote", is_active=True),

            Service(id=uuid.uuid4(), user_id=users[8].id,
                    category="language", title="Hindi / Tamil / Telugu Conversation Exchange",
                    description="If you're a German or European who wants to learn an Indian language, or an Indian who wants a conversation partner — let's swap! I offer Hindi and basic Tamil.",
                    is_paid=False, mode="remote", is_active=True),
        ]

        added_svcs = 0
        for svc in services:
            existing = db.query(Service).filter(Service.title == svc.title).first()
            if not existing:
                db.add(svc)
                added_svcs += 1
        db.flush()
        print(f"Services: {added_svcs} added")

        # ── Programs ──────────────────────────────────────────────────────────
        programs = [
            Program(id=uuid.uuid4(), user_id=amit.id,
                    category="networking", title="Desiface Launch Meetup — Munich",
                    description="The first in-person Desiface community meetup in Munich! Come meet fellow Indians in Germany, share your story, and help shape where this community goes next. Food and drinks provided.",
                    event_date=future(days=14), is_online=False, location="Munich Stadtcenter, Marienplatz",
                    capacity=50, is_free=True),

            Program(id=uuid.uuid4(), user_id=users[0].id,
                    category="workshop", title="How to Get Your Blue Card in 2026",
                    description="Step-by-step walkthrough of the Blue Card application process in Germany. Covers eligibility, document checklist, Ausländerbehörde tips, and common mistakes to avoid. Q&A at the end.",
                    event_date=future(days=7), is_online=True, location=None,
                    capacity=100, is_free=True),

            Program(id=uuid.uuid4(), user_id=users[1].id,
                    category="study_group", title="German B1 Exam Study Group",
                    description="Weekly study group for people preparing for the Goethe B1 exam. We practice Schreiben, Hören, and Lesen together. All levels from A2+ welcome. Max 8 people per session.",
                    event_date=future(days=3), is_online=True, location=None,
                    capacity=8, is_free=True),

            Program(id=uuid.uuid4(), user_id=users[2].id,
                    category="cultural", title="Diwali Community Celebration — Berlin",
                    description="Celebrating Diwali together in Berlin! Traditional food, rangoli making, music, and fireworks. Families welcome. Bring a dish to share if you can — we'll have the basics covered.",
                    event_date=future(days=30), is_online=False, location="Tempelhof Field, Berlin",
                    capacity=200, is_free=True),

            Program(id=uuid.uuid4(), user_id=users[3].id,
                    category="webinar", title="NRI Tax Filing 101 — India + Germany",
                    description="Live webinar covering DTAA rules, NRE/NRO accounts, advance tax, and how to avoid double taxation. Real examples from Indians living in Germany. Recording available after.",
                    event_date=future(days=10), is_online=True, location=None,
                    capacity=500, is_free=True),

            Program(id=uuid.uuid4(), user_id=users[4].id,
                    category="meetup", title="Indian Techies Frankfurt Stammtisch",
                    description="Monthly informal meetup for Indian tech professionals in Frankfurt. No agenda, just good conversations over Apfelwein. Show up, meet people, make friends.",
                    event_date=future(days=21), is_online=False, location="Zum Gemalten Haus, Frankfurt",
                    capacity=None, is_free=True),

            Program(id=uuid.uuid4(), user_id=users[5].id,
                    category="workshop", title="Negotiating Your Salary in Germany",
                    description="How to negotiate your salary as an Indian professional in Germany. German workplace culture around pay, what to say and what not to say, and how to benchmark your market rate.",
                    event_date=future(days=5, hours=2), is_online=True, location=None,
                    capacity=60, is_free=True),
        ]

        added_progs = 0
        prog_objects = []
        for prog in programs:
            existing = db.query(Program).filter(Program.title == prog.title).first()
            if not existing:
                db.add(prog)
                prog_objects.append(prog)
                added_progs += 1
            else:
                prog_objects.append(existing)
        db.flush()
        print(f"Programs: {added_progs} added")

        # Amit RSVPs to programs he didn't create
        rsvp_count = 0
        for prog in prog_objects:
            if prog.user_id != amit.id:
                existing = db.query(ProgramRSVP).filter(
                    ProgramRSVP.program_id == prog.id, ProgramRSVP.user_id == amit.id
                ).first()
                if not existing:
                    db.add(ProgramRSVP(id=uuid.uuid4(), program_id=prog.id, user_id=amit.id))
                    rsvp_count += 1

        # Other users RSVP to Amit's meetup
        for user in users[:8]:
            prog = prog_objects[0]
            existing = db.query(ProgramRSVP).filter(
                ProgramRSVP.program_id == prog.id, ProgramRSVP.user_id == user.id
            ).first()
            if not existing:
                db.add(ProgramRSVP(id=uuid.uuid4(), program_id=prog.id, user_id=user.id))
                rsvp_count += 1

        db.flush()
        print(f"RSVPs: {rsvp_count} added")

        # ── Tagged posts ──────────────────────────────────────────────────────
        tagged_posts = [
            (amit, "visa", "Just helped 3 friends get their Blue Cards approved this month! The Ausländerbehörde in Munich is backed up 3 months but here's the trick: show up at 7:30am, be first in the queue, bring ALL documents + copies. Happy to help anyone going through the process — just DM me. #bluecard #visa #germany"),
            (amit, "career", "Honest take on tech salaries in Germany vs India: my TC went up 3x when I moved but the tax takes ~42%. Net-net you're still better off but not by as much as the gross numbers suggest. Always negotiate hard and factor in benefits — health insurance, pension, 30 days leave. Worth it, but go in informed."),
            (users[0], "legal", "IMPORTANT if you're switching jobs in Germany: your employment contract's notice period might be 3 months, not the default 4 weeks. Read your Kündigungsschutz clauses carefully before you resign. Got caught out myself — had to delay my new job by 2 months. Learn from my mistake."),
            (users[1], "tax", "Tax season reminder: if you have income from India (rent, dividends, FD interest) while living in Germany, you MUST declare it in Germany under DTAA. Not declaring is tax evasion, even if you paid tax in India. The good news: most of it gets offset. See a Steuerberater."),
            (users[2], "teaching", "Starting free German A1-B1 group sessions every Saturday at 10am (online). Focus on practical German for daily life and work — not textbook exercises. Max 6 people per group so everyone gets speaking time. DM me to join the next batch starting in 2 weeks."),
            (users[3], "finance", "NRE vs NRO account — a question I get asked constantly:\n\nNRE: Tax-free in India, fully repatriable. For money earned abroad.\nNRO: Taxable in India, limited repatriation. For Indian income.\n\nIf you're sending money home, park it in NRE. If you have rent/income in India, that goes to NRO. Simple as that."),
            (users[4], "networking", "Berlin Indians WhatsApp group just hit 500 members 🎉 What started as 12 people sharing apartment tips has become job referrals, Diwali celebrations, hiking trips, and friendships. Community > everything. DM me if you're new to Berlin and want to join."),
            (users[5], "housing", "Berlin flat hunting survival guide:\n\n1. Scoutimmobilien + ImmobilienScout24 — check at 8am daily\n2. Apply within 2 hours of listing going live\n3. Your Mietinteressentenbogen matters more than you think\n4. Offer 1-2 months cold rent as deposit upfront (if you can)\n5. Get a German colleague to call on your behalf\n\nTook me 4 months. Worth it."),
            (users[6], "cultural", "Something magical happened today: my German colleagues asked me to teach them how to make biryani at our office potluck. 2 years ago I was nervous about bringing Indian food to work. Today they were fighting over the leftovers. Small moments of cultural exchange > everything."),
            (users[7], "career", "German interview culture vs Indian interview culture:\n\nGermany: Structured, punctual, technical focus, clear yes/no outcome\nIndia: Relationship-heavy, flexible timing, negotiation-heavy\n\nAdapting: Be precise, ask questions, show process not just outcomes. No vague 'I'm a team player' — give specific examples. Works every time."),
        ]

        added_posts = 0
        for author, tag, content in tagged_posts:
            existing = db.query(Post).filter(Post.content == content).first()
            if not existing:
                db.add(Post(id=uuid.uuid4(), user_id=author.id, content=content, tag=tag,
                            visibility="public", created_at=ts(hours_ago=added_posts * 2)))
                added_posts += 1
        db.flush()
        print(f"Tagged posts: {added_posts} added")

        db.commit()
        print("\n✅ Community seed complete!")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run()
