"""
Integration tests for the user feedback system.
Covers: submit, admin list, admin resolve, non-admin access restriction.
"""
from sqlalchemy.orm import Session

from app.models.user import User
from tests.conftest import auth


def _make_admin(db: Session, email: str) -> None:
    db.query(User).filter(User.email == email).update({"is_admin": True})
    db.commit()


class TestSubmitFeedback:
    def test_authenticated_user_can_submit_feedback(self, client):
        h = auth(client, "fb_user@example.com")
        r = client.post("/feedback", json={"type": "feedback", "message": "Love the app!"}, headers=h)
        assert r.status_code == 201
        body = r.json()
        assert "id" in body  # returns {"id": "<uuid>"}

    def test_submit_bug_report(self, client):
        h = auth(client, "bug_user@example.com")
        r = client.post("/feedback", json={"type": "bug", "message": "Login broken"}, headers=h)
        assert r.status_code == 201
        assert "id" in r.json()

    def test_unauthenticated_cannot_submit(self, client):
        r = client.post("/feedback", json={"type": "feedback", "message": "Hi"})
        assert r.status_code == 401

    def test_empty_message_rejected(self, client):
        h = auth(client, "empty_fb@example.com")
        r = client.post("/feedback", json={"type": "feedback", "message": "   "}, headers=h)
        assert r.status_code == 400


class TestAdminFeedbackList:
    def test_admin_can_list_feedback(self, client, db):
        h_user = auth(client, "fb_submitter@example.com")
        client.post("/feedback", json={"type": "feedback", "message": "Great!"}, headers=h_user)

        h_admin = auth(client, "fb_admin@example.com")
        _make_admin(db, "fb_admin@example.com")

        r = client.get("/feedback", headers=h_admin)
        assert r.status_code == 200
        body = r.json()
        assert "items" in body
        assert body["total"] >= 1

    def test_non_admin_cannot_list_feedback(self, client):
        h = auth(client, "nonadmin_fb@example.com")
        r = client.get("/feedback", headers=h)
        assert r.status_code == 403

    def test_filter_by_type(self, client, db):
        h_user = auth(client, "filter_user@example.com")
        client.post("/feedback", json={"type": "feedback", "message": "Feedback"}, headers=h_user)
        client.post("/feedback", json={"type": "bug", "message": "Bug"}, headers=h_user)

        h_admin = auth(client, "filter_admin@example.com")
        _make_admin(db, "filter_admin@example.com")

        r = client.get("/feedback?type=bug", headers=h_admin)
        items = r.json()["items"]
        assert len(items) >= 1
        assert all(i["type"] == "bug" for i in items)


class TestAdminResolve:
    def test_admin_can_resolve_feedback(self, client, db):
        h_user = auth(client, "resolve_user@example.com")
        fb_id = client.post(
            "/feedback", json={"type": "feedback", "message": "Resolve me"}, headers=h_user
        ).json()["id"]

        h_admin = auth(client, "resolve_admin@example.com")
        _make_admin(db, "resolve_admin@example.com")

        r = client.patch(f"/feedback/{fb_id}/resolve", headers=h_admin)
        assert r.status_code == 200
        assert r.json()["is_resolved"] is True

    def test_admin_can_reopen_feedback(self, client, db):
        h_user = auth(client, "reopen_user@example.com")
        fb_id = client.post(
            "/feedback", json={"type": "feedback", "message": "Reopen me"}, headers=h_user
        ).json()["id"]

        h_admin = auth(client, "reopen_admin@example.com")
        _make_admin(db, "reopen_admin@example.com")

        client.patch(f"/feedback/{fb_id}/resolve", headers=h_admin)
        r = client.patch(f"/feedback/{fb_id}/resolve", headers=h_admin)
        assert r.json()["is_resolved"] is False

    def test_non_admin_cannot_resolve(self, client, db):
        h_user = auth(client, "nres_user@example.com")
        fb_id = client.post(
            "/feedback", json={"type": "feedback", "message": "Nope"}, headers=h_user
        ).json()["id"]

        h_other = auth(client, "nres_other@example.com")
        r = client.patch(f"/feedback/{fb_id}/resolve", headers=h_other)
        assert r.status_code == 403
