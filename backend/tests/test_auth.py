"""
Unit / integration tests for the OTP auth flow.
"""
from tests.conftest import auth, obtain_token


class TestRequestOTP:
    def test_returns_dev_otp_in_dev_mode(self, client):
        r = client.post("/auth/request-otp", json={"email": "test@example.com"})
        assert r.status_code == 200
        body = r.json()
        assert "dev_otp" in body
        assert len(body["dev_otp"]) == 6
        assert body["dev_otp"].isdigit()

    def test_rejects_invalid_email(self, client):
        r = client.post("/auth/request-otp", json={"email": "not-an-email"})
        assert r.status_code == 422

    def test_invalidates_previous_otp_on_re_request(self, client):
        email = "reuse@example.com"
        r1 = client.post("/auth/request-otp", json={"email": email})
        old_otp = r1.json()["dev_otp"]

        r2 = client.post("/auth/request-otp", json={"email": email})
        new_otp = r2.json()["dev_otp"]

        # Old OTP is now invalid
        r = client.post("/auth/verify-otp", json={"email": email, "code": old_otp})
        assert r.status_code == 400

        # New OTP works
        r = client.post("/auth/verify-otp", json={"email": email, "code": new_otp})
        assert r.status_code == 200


class TestVerifyOTP:
    def test_valid_otp_returns_token_and_user(self, client):
        email = "verify@example.com"
        r1 = client.post("/auth/request-otp", json={"email": email})
        otp = r1.json()["dev_otp"]

        r2 = client.post("/auth/verify-otp", json={"email": email, "code": otp})
        assert r2.status_code == 200
        body = r2.json()
        assert "access_token" in body
        assert body["user"]["email"] == email

    def test_wrong_otp_returns_400(self, client):
        email = "wrong@example.com"
        client.post("/auth/request-otp", json={"email": email})
        r = client.post("/auth/verify-otp", json={"email": email, "code": "000000"})
        assert r.status_code == 400

    def test_auto_creates_user_on_first_login(self, client):
        email = "brand_new@example.com"
        r1 = client.post("/auth/request-otp", json={"email": email})
        otp = r1.json()["dev_otp"]
        r2 = client.post("/auth/verify-otp", json={"email": email, "code": otp})
        assert r2.status_code == 200
        user = r2.json()["user"]
        assert user["email"] == email
        assert user["username"]  # auto-generated

    def test_same_user_returned_on_second_login(self, client):
        email = "returning@example.com"
        token1 = obtain_token(client, email)
        token2 = obtain_token(client, email)
        # Both tokens are for the same user
        me1 = client.get("/auth/me", headers={"Authorization": f"Bearer {token1}"})
        me2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token2}"})
        assert me1.json()["id"] == me2.json()["id"]

    def test_otp_can_only_be_used_once(self, client):
        email = "onetime@example.com"
        r1 = client.post("/auth/request-otp", json={"email": email})
        otp = r1.json()["dev_otp"]

        client.post("/auth/verify-otp", json={"email": email, "code": otp})
        r2 = client.post("/auth/verify-otp", json={"email": email, "code": otp})
        assert r2.status_code == 400


class TestMe:
    def test_authenticated_user_can_fetch_self(self, client):
        headers = auth(client, "me@example.com")
        r = client.get("/auth/me", headers=headers)
        assert r.status_code == 200
        assert r.json()["email"] == "me@example.com"

    def test_unauthenticated_request_returns_401(self, client):
        r = client.get("/auth/me")
        assert r.status_code == 401

    def test_invalid_token_returns_401(self, client):
        r = client.get("/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code == 401
