"""Tests for GET /api/progress and GET /api/history. Seeds meals via the
saved-meals log endpoint (pure DB, no LLM call) so these stay fast and
deterministic."""
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


class TestGetProgress:
    async def test_requires_authentication(self, client):
        res = await client.get("/api/progress")
        assert res.status_code == 401

    async def test_returns_90_empty_days_with_no_meals_logged(self, client):
        token = await signup_and_get_token(client)
        res = await client.get("/api/progress", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        body = res.json()
        assert len(body["summaries"]) == 90
        assert all(day["status"] == "empty" for day in body["summaries"])
        assert body["stats"]["total_meals"] == 0
        assert body["stats"]["total_days_logged"] == 0
        assert body["target_calories"] == 2000

    async def test_todays_summary_reflects_a_logged_meal(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        await log_a_meal(client, headers, weight_g=1290)  # ~1999.5 kcal, just under target

        res = await client.get("/api/progress", headers=headers)
        body = res.json()
        today = body["summaries"][-1]
        assert today["calories"] == pytest.approx(1999.5, abs=1)
        assert today["status"] == "met"
        assert today["meal_count"] == 1
        assert body["stats"]["total_meals"] == 1
        assert body["stats"]["total_days_logged"] == 1
        assert body["stats"]["current_streak"] == 1

    async def test_does_not_include_another_users_meals(self, client):
        token_a = await signup_and_get_token(client, "alice")
        token_b = await signup_and_get_token(client, "bob")
        await log_a_meal(client, {"Authorization": f"Bearer {token_a}"})

        res = await client.get("/api/progress", headers={"Authorization": f"Bearer {token_b}"})
        assert res.json()["stats"]["total_meals"] == 0


class TestGetHistory:
    async def test_requires_authentication(self, client):
        res = await client.get("/api/history")
        assert res.status_code == 401

    async def test_empty_when_nothing_logged(self, client):
        token = await signup_and_get_token(client)
        res = await client.get("/api/history", headers={"Authorization": f"Bearer {token}"})
        body = res.json()
        assert body["meals"] == []
        assert body["total"] == 0
        assert body["total_pages"] == 1

    async def test_paginates_newest_first(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        for i in range(3):
            await log_a_meal(client, headers, name=f"Meal {i}")

        page1 = await client.get("/api/history?page=1&per_page=2", headers=headers)
        body1 = page1.json()
        assert body1["total"] == 3
        assert body1["total_pages"] == 2
        assert len(body1["meals"]) == 2
        assert body1["meals"][0]["raw_transcript"] == "Logged saved meal: Meal 2"

        page2 = await client.get("/api/history?page=2&per_page=2", headers=headers)
        assert len(page2.json()["meals"]) == 1

    async def test_does_not_include_another_users_meals(self, client):
        token_a = await signup_and_get_token(client, "alice")
        token_b = await signup_and_get_token(client, "bob")
        await log_a_meal(client, {"Authorization": f"Bearer {token_a}"})

        res = await client.get("/api/history", headers={"Authorization": f"Bearer {token_b}"})
        assert res.json()["meals"] == []
