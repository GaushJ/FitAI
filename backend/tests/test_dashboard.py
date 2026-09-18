"""Tests for GET /api/dashboard. Seeds today's food log via the saved-meals
log endpoint (pure DB, no LLM call) rather than /api/track-meal, so these
stay fast and deterministic."""
import pytest


async def signup_and_get_token(client, username="ada"):
    res = await client.post(
        "/api/auth/signup",
        json={"username": username, "password": "hunter22", "name": "Ada Lovelace"},
    )
    return res.json()["access_token"]


def egg_ingredient(weight_g=200):
    return {
        "name": "egg",
        "brand": None,
        "weight_g": weight_g,
        "calories_per_100g": 155,
        "protein_per_100g": 13,
        "carbs_per_100g": 1.1,
        "fat_per_100g": 11,
    }


async def log_a_meal(client, headers, name="Omelette", weight_g=200):
    created = await client.post("/api/saved-meals", json={"name": name, "ingredients": [egg_ingredient(weight_g)]}, headers=headers)
    meal_id = created.json()["id"]
    return await client.post(f"/api/saved-meals/{meal_id}/log", json={}, headers=headers)


class TestGetDashboard:
    async def test_requires_authentication(self, client):
        res = await client.get("/api/dashboard")
        assert res.status_code == 401

    async def test_shows_zeroed_totals_with_no_meals_logged(self, client):
        token = await signup_and_get_token(client)
        res = await client.get("/api/dashboard", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        body = res.json()
        assert body["totals"]["calories"] == 0
        assert body["meals"] == []
        assert body["user"]["username"] == "ada"

    async def test_reflects_a_logged_meal_in_todays_totals(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        await log_a_meal(client, headers)

        res = await client.get("/api/dashboard", headers=headers)
        body = res.json()
        assert body["totals"]["calories"] == pytest.approx(310, abs=1)
        assert len(body["meals"]) == 1
        assert body["meals"][0]["raw_transcript"] == "Logged saved meal: Omelette"

    async def test_sums_multiple_meals_logged_today(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        await log_a_meal(client, headers, name="Omelette", weight_g=200)
        await log_a_meal(client, headers, name="Second Omelette", weight_g=100)

        res = await client.get("/api/dashboard", headers=headers)
        body = res.json()
        assert len(body["meals"]) == 2
        assert body["totals"]["calories"] == pytest.approx(465, abs=1)

    async def test_does_not_include_another_users_meals(self, client):
        token_a = await signup_and_get_token(client, "alice")
        token_b = await signup_and_get_token(client, "bob")
        await log_a_meal(client, {"Authorization": f"Bearer {token_a}"})

        res = await client.get("/api/dashboard", headers={"Authorization": f"Bearer {token_b}"})
        assert res.json()["meals"] == []
