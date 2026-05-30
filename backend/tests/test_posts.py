"""
Integration tests for the posts system.
Covers: create, read, edit, delete, like/unlike, comment, save.
"""
from tests.conftest import auth


class TestCreatePost:
    def test_create_text_post(self, client):
        h = auth(client, "poster@example.com")
        r = client.post("/posts", json={"content": "Hello world"}, headers=h)
        assert r.status_code == 201
        body = r.json()
        assert body["content"] == "Hello world"
        assert body["author"]["email"] == "poster@example.com"

    def test_create_post_with_tag(self, client):
        h = auth(client, "tagged@example.com")
        r = client.post("/posts", json={"content": "Tech post", "tag": "tech"}, headers=h)
        assert r.status_code == 201
        assert r.json()["tag"] == "tech"

    def test_create_post_with_invalid_tag_rejected(self, client):
        h = auth(client, "badtag@example.com")
        r = client.post("/posts", json={"content": "Bad tag", "tag": "nonsense"}, headers=h)
        assert r.status_code == 422

    def test_unauthenticated_cannot_post(self, client):
        r = client.post("/posts", json={"content": "Should fail"})
        assert r.status_code == 401


class TestFeed:
    def test_own_posts_appear_in_feed(self, client):
        h = auth(client, "feed_me@example.com")
        client.post("/posts", json={"content": "My post"}, headers=h)
        r = client.get("/posts", headers=h)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_connected_user_posts_appear_in_feed(self, client):
        h1 = auth(client, "feed_alice@example.com")
        h2 = auth(client, "feed_bob@example.com")
        bob_id = client.get("/auth/me", headers=h2).json()["id"]
        conn_id = client.post(f"/connections/{bob_id}", headers=h1).json()["id"]
        client.patch(f"/connections/{conn_id}/accept", headers=h2)

        client.post("/posts", json={"content": "Bob's post"}, headers=h2)
        feed = client.get("/posts", headers=h1).json()
        contents = [p["content"] for p in feed]
        assert "Bob's post" in contents

    def test_strangers_posts_not_in_feed(self, client):
        h1 = auth(client, "stranger_alice@example.com")
        h2 = auth(client, "stranger_bob@example.com")
        client.post("/posts", json={"content": "Bob private"}, headers=h2)

        feed = client.get("/posts", headers=h1).json()
        contents = [p["content"] for p in feed]
        assert "Bob private" not in contents


class TestEditDeletePost:
    def test_author_can_edit_post(self, client):
        h = auth(client, "edit_me@example.com")
        post_id = client.post("/posts", json={"content": "Original"}, headers=h).json()["id"]

        r = client.patch(f"/posts/{post_id}", json={"content": "Edited"}, headers=h)
        assert r.status_code == 200
        assert r.json()["content"] == "Edited"

    def test_non_author_cannot_edit_post(self, client):
        h1 = auth(client, "edit_owner@example.com")
        h2 = auth(client, "edit_thief@example.com")
        post_id = client.post("/posts", json={"content": "Owner post"}, headers=h1).json()["id"]

        r = client.patch(f"/posts/{post_id}", json={"content": "Stolen"}, headers=h2)
        assert r.status_code == 403

    def test_author_can_delete_post(self, client):
        h = auth(client, "del_me@example.com")
        post_id = client.post("/posts", json={"content": "Delete me"}, headers=h).json()["id"]

        r = client.delete(f"/posts/{post_id}", headers=h)
        assert r.status_code == 204

    def test_non_author_cannot_delete_post(self, client):
        h1 = auth(client, "del_owner@example.com")
        h2 = auth(client, "del_thief@example.com")
        post_id = client.post("/posts", json={"content": "Safe"}, headers=h1).json()["id"]

        r = client.delete(f"/posts/{post_id}", headers=h2)
        assert r.status_code == 403


class TestLikes:
    def test_like_a_post(self, client):
        h = auth(client, "liker@example.com")
        post_id = client.post("/posts", json={"content": "Like me"}, headers=h).json()["id"]

        r = client.post(f"/posts/{post_id}/like", json={"reaction_type": "like"}, headers=h)
        assert r.status_code in (200, 201)
        body = r.json()
        assert body["liked_by_me"] is True

    def test_unlike_a_post(self, client):
        h = auth(client, "unliker@example.com")
        post_id = client.post("/posts", json={"content": "Unlike me"}, headers=h).json()["id"]
        client.post(f"/posts/{post_id}/like", json={"reaction_type": "like"}, headers=h)

        r = client.delete(f"/posts/{post_id}/like", headers=h)
        assert r.status_code == 200
        assert r.json()["liked_by_me"] is False

    def test_like_count_increments(self, client):
        h1 = auth(client, "count_alice@example.com")
        h2 = auth(client, "count_bob@example.com")
        post_id = client.post("/posts", json={"content": "Count likes"}, headers=h1).json()["id"]

        client.post(f"/posts/{post_id}/like", json={"reaction_type": "love"}, headers=h1)
        client.post(f"/posts/{post_id}/like", json={"reaction_type": "like"}, headers=h2)

        feed = client.get("/posts", headers=h1).json()
        post = next(p for p in feed if p["id"] == post_id)
        assert post["like_count"] == 2


class TestComments:
    def test_add_comment(self, client):
        h = auth(client, "commenter@example.com")
        post_id = client.post("/posts", json={"content": "Post to comment"}, headers=h).json()["id"]

        r = client.post(f"/posts/{post_id}/comments", json={"content": "Nice post!"}, headers=h)
        assert r.status_code == 201
        assert r.json()["content"] == "Nice post!"

    def test_comment_count_increases(self, client):
        h = auth(client, "ccount@example.com")
        post_id = client.post("/posts", json={"content": "Count comments"}, headers=h).json()["id"]
        client.post(f"/posts/{post_id}/comments", json={"content": "First"}, headers=h)
        client.post(f"/posts/{post_id}/comments", json={"content": "Second"}, headers=h)

        feed = client.get("/posts", headers=h).json()
        post = next(p for p in feed if p["id"] == post_id)
        assert post["comment_count"] == 2

    def test_reply_to_comment(self, client):
        h = auth(client, "reply@example.com")
        post_id = client.post("/posts", json={"content": "Threaded"}, headers=h).json()["id"]
        comment_id = client.post(
            f"/posts/{post_id}/comments", json={"content": "Parent"}, headers=h
        ).json()["id"]

        r = client.post(
            f"/posts/{post_id}/comments",
            json={"content": "Child", "parent_id": comment_id},
            headers=h,
        )
        assert r.status_code == 201
        assert r.json()["parent_id"] == comment_id


class TestSavedPosts:
    def test_save_and_unsave_post(self, client):
        h = auth(client, "saver@example.com")
        post_id = client.post("/posts", json={"content": "Save me"}, headers=h).json()["id"]

        r = client.post(f"/posts/{post_id}/save", headers=h)
        assert r.status_code in (200, 201)

        saved = client.get("/posts/saved", headers=h).json()
        assert any(p["id"] == post_id for p in saved)

        r2 = client.delete(f"/posts/{post_id}/save", headers=h)
        assert r2.status_code == 200

        saved2 = client.get("/posts/saved", headers=h).json()
        assert not any(p["id"] == post_id for p in saved2)
