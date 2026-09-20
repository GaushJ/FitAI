"""Tests for /api/saved-meals — user-created meal templates. Pure CRUD, no
LLM calls involved, so every case here is fast and deterministic."""
import pytest


async def signup_and_get_token(client, username="ada"):
    res = await client.post(
        "/api/auth/signup",
        json={"username": username, "password": "hunter22", "name": "Ada Lovelace"},
    )
    return res.json()["access_token"]


def egg_ingredient(weight_g=100):
    return {
        "name": "egg",
        "brand": None,
        "weight_g": weight_g,
        "calories_per_100g": 155,
        "protein_per_100g": 13,
        "carbs_per_100g": 1.1,
        "fat_per_100g": 11,
    }


class TestCreateSavedMeal:
    async def test_creates_a_meal_with_computed_serialization(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.post(
            "/api/saved-meals",
            json={"name": "Omelette", "ingredients": [egg_ingredient(200)]},
            headers=headers,
        )
        assert res.status_code == 200
        body = res.json()
        assert body["name"] == "Omelette"
        assert body["ingredients"][0]["weight_g"] == 200
        assert body["id"]

    async def test_rejects_an_empty_name(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.post(
            "/api/saved-meals", json={"name": "  ", "ingredients": [egg_ingredient()]}, headers=headers
        )
        assert res.status_code == 400

    async def test_rejects_no_ingredients(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.post("/api/saved-meals", json={"name": "Empty", "ingredients": []}, headers=headers)
        assert res.status_code == 400

    async def test_requires_authentication(self, client):
        res = await client.post("/api/saved-meals", json={"name": "Omelette", "ingredients": [egg_ingredient()]})
        assert res.status_code == 401


class TestListAndScoping:
    async def test_users_do_not_see_each_others_saved_meals(self, client):
        token_a = await signup_and_get_token(client, "alice")
        token_b = await signup_and_get_token(client, "bob")

        await client.post(
            "/api/saved-meals",
            json={"name": "Alice's Omelette", "ingredients": [egg_ingredient()]},
            headers={"Authorization": f"Bearer {token_a}"},
        )

        alice_meals = await client.get("/api/saved-meals", headers={"Authorization": f"Bearer {token_a}"})
        bob_meals = await client.get("/api/saved-meals", headers={"Authorization": f"Bearer {token_b}"})

        assert len(alice_meals.json()) == 1
        assert len(bob_meals.json()) == 0


class TestUpdateSavedMeal:
    async def test_updates_name_and_ingredients(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        created = await client.post(
            "/api/saved-meals", json={"name": "Omelette", "ingredients": [egg_ingredient()]}, headers=headers
        )
        meal_id = created.json()["id"]

        res = await client.put(
            f"/api/saved-meals/{meal_id}",
            json={"name": "Big Omelette", "ingredients": [egg_ingredient(300)]},
            headers=headers,
        )
        assert res.status_code == 200
        assert res.json()["name"] == "Big Omelette"
        assert res.json()["ingredients"][0]["weight_g"] == 300

    async def test_cannot_update_another_users_meal(self, client):
        token_a = await signup_and_get_token(client, "alice")
        token_b = await signup_and_get_token(client, "bob")
        created = await client.post(
            "/api/saved-meals",
            json={"name": "Alice's Omelette", "ingredients": [egg_ingredient()]},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        meal_id = created.json()["id"]

        res = await client.put(
            f"/api/saved-meals/{meal_id}",
            json={"name": "Hijacked"},
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert res.status_code == 404

    async def test_rejects_clearing_the_name(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        created = await client.post(
            "/api/saved-meals", json={"name": "Omelette", "ingredients": [egg_ingredient()]}, headers=headers
        )
        meal_id = created.json()["id"]

        res = await client.put(f"/api/saved-meals/{meal_id}", json={"name": "  "}, headers=headers)
        assert res.status_code == 400


class TestDeleteSavedMeal:
    async def test_deletes_the_meal(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        created = await client.post(
            "/api/saved-meals", json={"name": "Omelette", "ingredients": [egg_ingredient()]}, headers=headers
        )
        meal_id = created.json()["id"]

        res = await client.delete(f"/api/saved-meals/{meal_id}", headers=headers)
        assert res.status_code == 200

        listing = await client.get("/api/saved-meals", headers=headers)
        assert listing.json() == []

    async def test_returns_404_for_a_meal_that_does_not_exist(self, client):
        token = await signup_and_get_token(client)
        res = await client.delete("/api/saved-meals/999999", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 404


class TestLogSavedMeal:
    async def test_logs_the_meal_and_increments_streak(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        created = await client.post(
            "/api/saved-meals", json={"name": "Omelette", "ingredients": [egg_ingredient(200)]}, headers=headers
        )
        meal_id = created.json()["id"]

        res = await client.post(f"/api/saved-meals/{meal_id}/log", json={}, headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert body["name"] == "Omelette"
        assert body["streak"] == 1
        assert body["macros"]["calories"] == pytest.approx(310, abs=1)

    async def test_logs_with_overridden_ingredients_without_changing_the_template(self, client):
        token = await signup_and_get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        created = await client.post(
            "/api/saved-meals", json={"name": "Omelette", "ingredients": [egg_ingredient(200)]}, headers=headers
        )
        meal_id = created.json()["id"]

        res = await client.post(
            f"/api/saved-meals/{meal_id}/log",
            json={"ingredients": [egg_ingredient(400)]},
            headers=headers,
        )
        assert res.status_code == 200
        assert res.json()["macros"]["calories"] == pytest.approx(620, abs=1)

        # Template itself is untouched
        listing = await client.get("/api/saved-meals", headers=headers)
        assert listing.json()[0]["ingredients"][0]["weight_g"] == 200

    async def test_returns_404_for_another_users_meal(self, client):
        token_a = await signup_and_get_token(client, "alice")
        token_b = await signup_and_get_token(client, "bob")
        created = await client.post(
            "/api/saved-meals",
            json={"name": "Alice's Omelette", "ingredients": [egg_ingredient()]},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        meal_id = created.json()["id"]

        res = await client.post(
            f"/api/saved-meals/{meal_id}/log", json={}, headers={"Authorization": f"Bearer {token_b}"}
        )
        assert res.status_code == 404
