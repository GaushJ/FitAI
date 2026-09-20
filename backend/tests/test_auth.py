"""Tests for /api/auth — first in priority order since every other endpoint
depends on a valid session (see the project plan's testing strategy)."""
import pytest


async def signup(client, username="ada", password="hunter22", name="Ada Lovelace"):
    return await client.post(
        "/api/auth/signup",
        json={"username": username, "password": password, "name": name},
    )


class TestSignup:
    async def test_creates_a_user_and_returns_a_token(self, client):
        res = await signup(client)
        assert res.status_code == 200
        body = res.json()
        assert body["access_token"]
        assert body["token_type"] == "bearer"
        assert body["user"]["username"] == "ada"
        assert body["user"]["name"] == "Ada Lovelace"

    async def test_rejects_a_duplicate_username(self, client):
        await signup(client)
        res = await signup(client, name="Someone Else")
        assert res.status_code == 400
        assert "already taken" in res.json()["detail"].lower()

    async def test_rejects_a_short_username(self, client):
        res = await signup(client, username="ab")
        assert res.status_code == 400

    async def test_rejects_a_short_password(self, client):
        res = await signup(client, password="short")
        assert res.status_code == 400

    async def test_rejects_an_empty_name(self, client):
        res = await signup(client, name="  ")
        assert res.status_code == 400


class TestLogin:
    async def test_logs_in_with_correct_credentials(self, client):
        await signup(client)
        res = await client.post("/api/auth/login", json={"username": "ada", "password": "hunter22"})
        assert res.status_code == 200
        body = res.json()
        assert body["access_token"]
        assert body["user"]["username"] == "ada"

    async def test_rejects_a_wrong_password(self, client):
        await signup(client)
        res = await client.post("/api/auth/login", json={"username": "ada", "password": "wrongpass"})
        assert res.status_code == 401

    async def test_rejects_a_nonexistent_user(self, client):
        res = await client.post("/api/auth/login", json={"username": "ghost", "password": "whatever"})
        assert res.status_code == 401


class TestGetCurrentUser:
    """Exercises the get_current_user dependency shared by every protected route."""

    async def test_protected_route_requires_a_token(self, client):
        res = await client.get("/api/user")
        assert res.status_code == 401

    async def test_protected_route_rejects_a_garbage_token(self, client):
        res = await client.get("/api/user", headers={"Authorization": "Bearer not-a-real-token"})
        assert res.status_code == 401

    async def test_protected_route_accepts_a_valid_token(self, client):
        signup_res = await signup(client)
        token = signup_res.json()["access_token"]
        res = await client.get("/api/user", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["username"] == "ada"
