"""Tests for /api/user — the profile/targets endpoint the mobile Settings
sheet reads from and writes to."""
import pytest


async def signup_and_get_token(client, username="ada"):
    res = await client.post(
        "/api/auth/signup",
        json={"username": username, "password": "hunter22", "name": "Ada Lovelace"},
    )
    return res.json()["access_token"]


class TestGetUserProfile:
    async def test_requires_authentication(self, client):
        res = await client.get("/api/user")
        assert res.status_code == 401

    async def test_returns_the_signed_up_users_defaults(self, client):
        token = await signup_and_get_token(client)
        res = await client.get("/api/user", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        body = res.json()
        assert body["username"] == "ada"
        assert body["name"] == "Ada Lovelace"
        assert body["current_streak"] == 0


class TestUpdateUserProfile:
    async def test_updates_name_and_targets(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.post(
            "/api/user",
            json={"name": "Ada L.", "target_calories": 2200, "target_protein": 160, "target_carbs": 220, "target_fat": 70},
            headers=headers,
        )
        assert res.status_code == 200
        assert res.json()["user"]["name"] == "Ada L."
        assert res.json()["user"]["target_calories"] == 2200

        # Persisted, not just echoed back
        get_res = await client.get("/api/user", headers=headers)
        assert get_res.json()["target_protein"] == 160

    async def test_requires_authentication(self, client):
        res = await client.post(
            "/api/user",
            json={"name": "X", "target_calories": 2000, "target_protein": 150, "target_carbs": 200, "target_fat": 60},
        )
        assert res.status_code == 401
