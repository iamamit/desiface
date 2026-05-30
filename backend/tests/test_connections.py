"""
Integration tests for the connections (friend request) system.
Covers: send, accept, decline, withdraw, list, duplicate prevention.
"""
from tests.conftest import auth


class TestSendRequest:
    def test_send_connection_request(self, client):
        h1 = auth(client, "alice@example.com")
        h2 = auth(client, "bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]

        r = client.post(f"/connections/{bob_id}", headers=h1)
        assert r.status_code == 201
        assert r.json()["status"] == "pending"

    def test_cannot_connect_to_self(self, client):
        h = auth(client, "solo@example.com")
        my_id = client.get("/auth/me", headers=h).json()["id"]
        r = client.post(f"/connections/{my_id}", headers=h)
        assert r.status_code == 400

    def test_duplicate_request_returns_409(self, client):
        h1 = auth(client, "dup_alice@example.com")
        h2 = auth(client, "dup_bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]

        client.post(f"/connections/{bob_id}", headers=h1)
        r = client.post(f"/connections/{bob_id}", headers=h1)
        assert r.status_code == 409

    def test_request_appears_in_sent_list(self, client):
        h1 = auth(client, "sender@example.com")
        h2 = auth(client, "receiver@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        client.post(f"/connections/{bob_id}", headers=h1)

        sent = client.get("/connections/sent", headers=h1).json()
        assert len(sent) == 1
        assert sent[0]["status"] == "pending"

    def test_request_appears_in_receiver_requests(self, client):
        h1 = auth(client, "s2@example.com")
        h2 = auth(client, "r2@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        client.post(f"/connections/{bob_id}", headers=h1)

        requests = client.get("/connections/requests", headers=h2).json()
        assert len(requests) == 1
        assert requests[0]["status"] == "pending"


class TestAcceptDecline:
    def test_accept_connection(self, client):
        h1 = auth(client, "acc_alice@example.com")
        h2 = auth(client, "acc_bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        conn_id = client.post(f"/connections/{bob_id}", headers=h1).json()["id"]

        r = client.patch(f"/connections/{conn_id}/accept", headers=h2)
        assert r.status_code == 200
        assert r.json()["status"] == "accepted"

    def test_accepted_connection_appears_in_friends_list(self, client):
        h1 = auth(client, "fr_alice@example.com")
        h2 = auth(client, "fr_bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        conn_id = client.post(f"/connections/{bob_id}", headers=h1).json()["id"]
        client.patch(f"/connections/{conn_id}/accept", headers=h2)

        friends = client.get("/connections", headers=h1).json()
        assert len(friends) == 1
        friends2 = client.get("/connections", headers=h2).json()
        assert len(friends2) == 1

    def test_decline_connection(self, client):
        h1 = auth(client, "dec_alice@example.com")
        h2 = auth(client, "dec_bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        conn_id = client.post(f"/connections/{bob_id}", headers=h1).json()["id"]

        r = client.patch(f"/connections/{conn_id}/decline", headers=h2)
        assert r.status_code == 200
        assert r.json()["status"] == "declined"

    def test_declined_request_not_in_requests_list(self, client):
        h1 = auth(client, "dec2_alice@example.com")
        h2 = auth(client, "dec2_bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        conn_id = client.post(f"/connections/{bob_id}", headers=h1).json()["id"]
        client.patch(f"/connections/{conn_id}/decline", headers=h2)

        requests = client.get("/connections/requests", headers=h2).json()
        assert len(requests) == 0

    def test_requester_cannot_accept_own_request(self, client):
        h1 = auth(client, "self_acc@example.com")
        h2 = auth(client, "other_acc@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        conn_id = client.post(f"/connections/{bob_id}", headers=h1).json()["id"]

        r = client.patch(f"/connections/{conn_id}/accept", headers=h1)
        assert r.status_code == 404


class TestWithdrawAndUnfriend:
    def test_withdraw_pending_request(self, client):
        h1 = auth(client, "with_alice@example.com")
        h2 = auth(client, "with_bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        conn_id = client.post(f"/connections/{bob_id}", headers=h1).json()["id"]

        r = client.delete(f"/connections/{conn_id}", headers=h1)
        assert r.status_code == 204

        sent = client.get("/connections/sent", headers=h1).json()
        assert len(sent) == 0

    def test_unfriend_accepted_connection(self, client):
        h1 = auth(client, "unf_alice@example.com")
        h2 = auth(client, "unf_bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        conn_id = client.post(f"/connections/{bob_id}", headers=h1).json()["id"]
        client.patch(f"/connections/{conn_id}/accept", headers=h2)

        r = client.delete(f"/connections/{conn_id}", headers=h1)
        assert r.status_code == 204
        assert len(client.get("/connections", headers=h1).json()) == 0

    def test_third_party_cannot_delete_connection(self, client):
        h1 = auth(client, "tp_alice@example.com")
        h2 = auth(client, "tp_bob@example.com")
        h3 = auth(client, "tp_eve@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        conn_id = client.post(f"/connections/{bob_id}", headers=h1).json()["id"]

        r = client.delete(f"/connections/{conn_id}", headers=h3)
        assert r.status_code == 404


class TestConnectionStatus:
    def test_no_connection(self, client):
        h1 = auth(client, "cs_alice@example.com")
        h2 = auth(client, "cs_bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]

        r = client.get(f"/connections/status/{bob_id}", headers=h1)
        assert r.status_code == 200
        s = r.json()
        assert s["connected"] is False
        assert s["pending_sent"] is False
        assert s["pending_received"] is False

    def test_pending_sent_status(self, client):
        h1 = auth(client, "pss_alice@example.com")
        h2 = auth(client, "pss_bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        client.post(f"/connections/{bob_id}", headers=h1)

        r = client.get(f"/connections/status/{bob_id}", headers=h1)
        s = r.json()
        assert s["pending_sent"] is True
        assert s["connection_id"] is not None

    def test_connected_status(self, client):
        h1 = auth(client, "conn_alice@example.com")
        h2 = auth(client, "conn_bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        conn_id = client.post(f"/connections/{bob_id}", headers=h1).json()["id"]
        client.patch(f"/connections/{conn_id}/accept", headers=h2)

        r = client.get(f"/connections/status/{bob_id}", headers=h1)
        assert r.json()["connected"] is True
