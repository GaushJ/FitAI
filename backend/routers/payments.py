"""One-time purchases, via paykit (embedded) + Razorpay.

paykit's own router provides /orders, /confirm, /orders/{id}, /{payment_id}/refunds,
and /webhooks/razorpay — this module just wires it to this app's auth and prices.
The actual unlock happens in _grant_pro below, from the payment.captured *webhook*,
not from /confirm — a user closing their browser mid-checkout still gets unlocked
once Razorpay's webhook lands (see paykit's "webhook is the source of truth" rule).
"""
from fastapi import HTTPException
from paykit import Money, build_service_from_env
from paykit.integrations.fastapi import create_payments_router

from core.security import get_current_user
from db.models import User
from db.session import AsyncSessionLocal
from db.crud.users import get_user_by_id

payment_service = build_service_from_env()

# amount is always resolved here, server-side — never trusted from the client.
PRICES = {
    "pro_unlock": Money(amount=49900, currency="INR"),
}


def _resolve_amount(request_body: dict, user: User) -> Money:
    # The frontend sends {"metadata": {"item": "pro_unlock"}} — paykit persists
    # `metadata` on the Order itself, so _grant_pro can read it back later from
    # the webhook without fit_app needing its own purchases table.
    item = request_body.get("metadata", {}).get("item")
    if item not in PRICES:
        raise HTTPException(status_code=400, detail=f"unknown item {item!r}")
    return PRICES[item]


router = create_payments_router(
    payment_service,
    prefix="/api/payments",
    auth_dependency=get_current_user,
    customer_ref_getter=lambda user, body: str(user.id),
    amount_resolver=_resolve_amount,
)


@payment_service.events.on("payment.captured")
async def _grant_pro(event) -> None:
    if event.payment is None or event.payment.order_id is None:
        return
    order = await payment_service.get_order(event.payment.order_id)
    if order is None or order.customer_ref is None:
        return
    if order.metadata.get("item") != "pro_unlock":
        return
    async with AsyncSessionLocal() as db:
        user = await get_user_by_id(db, int(order.customer_ref))
        if user and not user.is_pro:
            user.is_pro = True
            await db.commit()
