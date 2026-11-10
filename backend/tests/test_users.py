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


VALID_INPUTS = {
    "sex": "male", "age": 30, "height_cm": 180, "weight_kg": 80,
    "activity_level": "moderate", "goal": "maintain",
}


class TestCalculateTargets:
    async def test_requires_authentication(self, client):
        res = await client.post("/api/user/targets/calculate", json=VALID_INPUTS)
        assert res.status_code == 401

    async def test_returns_a_plan(self, client):
        token = await signup_and_get_token(client)
        res = await client.post(
            "/api/user/targets/calculate", json=VALID_INPUTS, headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        body = res.json()
        assert body["bmr"] == 1780
        assert body["tdee"] == 2759
        assert body["calories"] == 4 * body["protein"] + 4 * body["carbs"] + 9 * body["fat"]
        assert body["warnings"] == []

    async def test_does_not_save_anything(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        await client.post("/api/user/targets/calculate", json=VALID_INPUTS, headers=headers)
        profile = (await client.get("/api/user", headers=headers)).json()
        assert profile["target_calories"] == 2000
        assert profile["weight_kg"] is None

    @pytest.mark.parametrize(
        "change",
        [{"age": 12}, {"weight_kg": 10}, {"height_cm": 50}, {"sex": "other"}, {"goal": "shred"}, {"activity_level": "hyper"}],
    )
    async def test_rejects_invalid_input(self, client, change):
        token = await signup_and_get_token(client)
        res = await client.post(
            "/api/user/targets/calculate", json={**VALID_INPUTS, **change}, headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 422


class TestBodyProfilePersistence:
    BASE = {"name": "Ada", "target_calories": 2500, "target_protein": 160, "target_carbs": 280, "target_fat": 70}

    async def test_saves_and_returns_the_body_profile(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.post("/api/user", json={**self.BASE, **VALID_INPUTS}, headers=headers)
        assert res.status_code == 200
        profile = (await client.get("/api/user", headers=headers)).json()
        for key, value in VALID_INPUTS.items():
            assert profile[key] == value

    async def test_omitting_the_profile_keeps_existing_values(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        await client.post("/api/user", json={**self.BASE, **VALID_INPUTS}, headers=headers)
        await client.post("/api/user", json={**self.BASE, "target_calories": 2600}, headers=headers)
        profile = (await client.get("/api/user", headers=headers)).json()
        assert profile["target_calories"] == 2600
        assert profile["weight_kg"] == 80
        assert profile["goal"] == "maintain"

    async def test_dashboard_exposes_the_profile_for_prefilling(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        await client.post("/api/user", json={**self.BASE, **VALID_INPUTS}, headers=headers)
        user = (await client.get("/api/dashboard", headers=headers)).json()["user"]
        assert user["weight_kg"] == 80 and user["activity_level"] == "moderate"
