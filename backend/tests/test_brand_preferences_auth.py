"""Regression coverage for the brand-preferences user-scoping fix
(migrations/0002_brand_preferences_user_scope.sql) — the endpoints used to have
no auth at all. Full CRUD coverage for this router is scheduled for M3 per the
project plan; this just locks in the fix itself."""
import pytest


async def signup_and_get_token(client, username):
    res = await client.post(
        "/api/auth/signup",
        json={"username": username, "password": "hunter22", "name": username},
    )
    return res.json()["access_token"]


class TestBrandPreferencesAuth:
    async def test_requires_authentication(self, client):
        res = await client.get("/api/brand-preferences")
        assert res.status_code == 401

    async def test_users_do_not_see_each_others_preferences(self, client):
        token_a = await signup_and_get_token(client, "alice")
        token_b = await signup_and_get_token(client, "bob")

        await client.post(
            "/api/brand-preferences",
            json={"ingredient_name": "paneer", "preferred_brand": "amul"},
            headers={"Authorization": f"Bearer {token_a}"},
        )

        alice_prefs = await client.get("/api/brand-preferences", headers={"Authorization": f"Bearer {token_a}"})
        bob_prefs = await client.get("/api/brand-preferences", headers={"Authorization": f"Bearer {token_b}"})

        assert len(alice_prefs.json()) == 1
        assert alice_prefs.json()[0]["preferred_brand"] == "amul"
        assert len(bob_prefs.json()) == 0

    async def test_same_ingredient_name_is_independent_per_user(self, client):
        token_a = await signup_and_get_token(client, "carol")
        token_b = await signup_and_get_token(client, "dave")

        await client.post(
            "/api/brand-preferences",
            json={"ingredient_name": "paneer", "preferred_brand": "amul"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        await client.post(
            "/api/brand-preferences",
            json={"ingredient_name": "paneer", "preferred_brand": "mother_dairy"},
            headers={"Authorization": f"Bearer {token_b}"},
        )

        carol_prefs = await client.get("/api/brand-preferences", headers={"Authorization": f"Bearer {token_a}"})
        dave_prefs = await client.get("/api/brand-preferences", headers={"Authorization": f"Bearer {token_b}"})

        assert carol_prefs.json()[0]["preferred_brand"] == "amul"
        assert dave_prefs.json()[0]["preferred_brand"] == "mother_dairy"
