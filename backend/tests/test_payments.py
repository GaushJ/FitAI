"""Tests for /api/payments — uses paykit's DummyProvider (PAYKIT_PROVIDER=dummy,
set in conftest.py) so these need no real Razorpay keys. Exercises the actual
mounted routes end to end, proving routers/payments.py's wiring and its
payment.captured -> is_pro handler."""
import pytest

from routers.payments import payment_service


async def signup_and_get_token(client, username="ada"):
    res = await client.post(
        "/api/auth/signup",
        json={"username": username, "password": "hunter22", "name": "Ada Lovelace"},
    )
    return res.json()["access_token"]


async def test_create_order_and_confirm_checkout(client):
    token = await signup_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.post(
        "/api/payments/orders",
        json={"metadata": {"item": "pro_unlock"}},
        headers=headers,
    )

    assert res.status_code == 200
    body = res.json()
    assert body["order"]["amount"] == {"amount": 49900, "currency": "INR"}
    assert body["checkout"]["provider"] == "dummy"


async def test_unknown_item_is_rejected(client):
    token = await signup_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.post(
        "/api/payments/orders",
        json={"metadata": {"item": "not_a_real_item"}},
        headers=headers,
    )

    assert res.status_code == 400


async def test_orders_route_requires_auth(client):
    res = await client.post("/api/payments/orders", json={"metadata": {"item": "pro_unlock"}})
    assert res.status_code == 401


async def test_payment_captured_webhook_grants_pro(client):
    token = await signup_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # Baseline: not pro yet.
    profile = await client.get("/api/user", headers=headers)
    assert profile.json()["is_pro"] is False

    order_res = await client.post(
        "/api/payments/orders",
        json={"metadata": {"item": "pro_unlock"}},
        headers=headers,
    )
    order = order_res.json()["order"]

    provider = payment_service._provider  # DummyProvider, per PAYKIT_PROVIDER=dummy
    stored_order = await payment_service.get_order(order["id"])
    pp = provider.simulate_payment(stored_order.provider_order_id)
    checkout_result = provider.make_checkout_result(
        pp, provider_order_id=stored_order.provider_order_id
    )

    # Mirrors the frontend's /payments/confirm call — fast UI feedback, does NOT
    # itself grant pro (only the webhook does, per paykit's design).
    confirm_res = await client.post(
        "/api/payments/confirm",
        json={
            "provider_order_id": checkout_result.provider_order_id,
            "provider_payment_id": checkout_result.provider_payment_id,
            "signature": checkout_result.signature,
        },
        headers=headers,
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "captured"

    still_not_pro = await client.get("/api/user", headers=headers)
    assert still_not_pro.json()["is_pro"] is False

    # Now the actual webhook arrives (what Razorpay would send in production).
    from paykit.providers.dummy import placeholder_order, placeholder_payment

    raw_body, webhook_headers = provider.make_webhook(
        event_id="evt_test_1",
        event_type="payment.captured",
        order=placeholder_order(await provider.fetch_order(stored_order.provider_order_id)),
        payment=placeholder_payment(pp),
    )
    webhook_res = await client.post(
        "/api/payments/webhooks/dummy", content=raw_body, headers=webhook_headers
    )
    assert webhook_res.status_code == 200

    now_pro = await client.get("/api/user", headers=headers)
    assert now_pro.json()["is_pro"] is True


async def test_webhook_bad_signature_returns_400(client):
    res = await client.post(
        "/api/payments/webhooks/dummy",
        content=b'{"id":"evt","type":"payment.captured"}',
        headers={"X-Dummy-Signature": "not-real"},
    )
    assert res.status_code == 400
