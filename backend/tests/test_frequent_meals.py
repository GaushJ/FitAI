"""Tests for /api/frequent-meals. A meal only becomes "frequent" once its
ingredient fingerprint has been logged twice (see services/frequent_meals.py),
so these seed via the saved-meals log endpoint twice rather than mocking the
detection logic directly."""
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


async def make_frequent_meal(client, headers, weight_g=200):
    """Logs the same ingredient set twice via saved-meals so it crosses the
    log_count >= 2 threshold and surfaces in /api/frequent-meals."""
    created = await client.post(
        "/api/saved-meals", json={"name": "Omelette", "ingredients": [egg_ingredient(weight_g)]}, headers=headers
    )
    meal_id = created.json()["id"]
    await client.post(f"/api/saved-meals/{meal_id}/log", json={}, headers=headers)
    await client.post(f"/api/saved-meals/{meal_id}/log", json={}, headers=headers)


class TestListFrequentMeals:
    async def test_requires_authentication(self, client):
        res = await client.get("/api/frequent-meals")
        assert res.status_code == 401

    async def test_a_meal_logged_only_once_does_not_appear(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        created = await client.post(
            "/api/saved-meals", json={"name": "Omelette", "ingredients": [egg_ingredient()]}, headers=headers
        )
        await client.post(f"/api/saved-meals/{created.json()['id']}/log", json={}, headers=headers)

        res = await client.get("/api/frequent-meals", headers=headers)
        assert res.json() == []

    async def test_a_meal_logged_twice_appears_with_its_count(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        await make_frequent_meal(client, headers)

        res = await client.get("/api/frequent-meals", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert len(body) == 1
        assert body[0]["log_count"] == 2
        assert body[0]["display_name"] == "Egg"


class TestQuickLogFrequentMeal:
    async def test_logs_at_saved_portions_by_default(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        await make_frequent_meal(client, headers, weight_g=200)
        meal_id = (await client.get("/api/frequent-meals", headers=headers)).json()[0]["id"]

        res = await client.post(f"/api/frequent-meals/{meal_id}/log", json={}, headers=headers)
        assert res.status_code == 200
        assert res.json()["macros"]["calories"] == pytest.approx(310, abs=1)
        assert res.json()["streak"] == 1

    async def test_applies_portion_overrides(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        await make_frequent_meal(client, headers, weight_g=200)
        meal_id = (await client.get("/api/frequent-meals", headers=headers)).json()[0]["id"]

        res = await client.post(
            f"/api/frequent-meals/{meal_id}/log", json={"portions": {"egg": 400}}, headers=headers
        )
        assert res.status_code == 200
        assert res.json()["macros"]["calories"] == pytest.approx(620, abs=1)

    async def test_returns_404_for_another_users_meal(self, client):
        token_a = await signup_and_get_token(client, "alice")
        token_b = await signup_and_get_token(client, "bob")
        await make_frequent_meal(client, {"Authorization": f"Bearer {token_a}"})
        meal_id = (await client.get("/api/frequent-meals", headers={"Authorization": f"Bearer {token_a}"})).json()[0]["id"]

        res = await client.post(
            f"/api/frequent-meals/{meal_id}/log", json={}, headers={"Authorization": f"Bearer {token_b}"}
        )
        assert res.status_code == 404


class TestDeleteFrequentMeal:
    async def test_deletes_the_meal(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        await make_frequent_meal(client, headers)
        meal_id = (await client.get("/api/frequent-meals", headers=headers)).json()[0]["id"]

        res = await client.delete(f"/api/frequent-meals/{meal_id}", headers=headers)
        assert res.status_code == 200

        listing = await client.get("/api/frequent-meals", headers=headers)
        assert listing.json() == []

    async def test_returns_404_for_a_meal_that_does_not_exist(self, client):
        token = await signup_and_get_token(client)
        res = await client.delete("/api/frequent-meals/999999", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 404
