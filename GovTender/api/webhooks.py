import stripe
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from api.config import get_settings
from api.debug import log_debug

router = APIRouter()
settings = get_settings()

_TIER_MAP = {
    # Stripe price ID → plan tier name
}  # Populated from settings at startup


@router.post("/stripe")
async def stripe_webhook(request: Request) -> JSONResponse:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    log_debug("WEBHOOK_STRIPE_RECEIVED", {"sig_present": bool(sig_header)})

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    event_type = event["type"]
    log_debug("WEBHOOK_STRIPE_EVENT", {"type": event_type})

    if event_type == "customer.subscription.created":
        await _handle_subscription_created(event["data"]["object"])
    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_deleted(event["data"]["object"])
    elif event_type == "customer.subscription.updated":
        await _handle_subscription_updated(event["data"]["object"])

    return JSONResponse({"received": True})


async def _handle_subscription_created(subscription: dict) -> None:
    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    price_id = subscription["items"]["data"][0]["price"]["id"]
    tier = _resolve_tier(price_id)
    customer_id = subscription["customer"]

    async with AsyncSessionLocal() as db:
        await db.execute(
            text("""
                UPDATE subscribers
                SET plan_tier = :tier, plan_active = TRUE, plan_activated_at = NOW()
                WHERE stripe_customer_id = :customer_id
            """),
            {"tier": tier, "customer_id": customer_id},
        )
        await db.commit()
    log_debug("SUBSCRIPTION_CREATED", {"customer_id": customer_id, "tier": tier})


async def _handle_subscription_deleted(subscription: dict) -> None:
    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    async with AsyncSessionLocal() as db:
        await db.execute(
            text("UPDATE subscribers SET plan_active = FALSE WHERE stripe_customer_id = :cid"),
            {"cid": subscription["customer"]},
        )
        await db.commit()
    log_debug("SUBSCRIPTION_DELETED", {"customer_id": subscription["customer"]})


async def _handle_subscription_updated(subscription: dict) -> None:
    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    price_id = subscription["items"]["data"][0]["price"]["id"]
    tier = _resolve_tier(price_id)
    customer_id = subscription["customer"]

    async with AsyncSessionLocal() as db:
        await db.execute(
            text("UPDATE subscribers SET plan_tier = :tier WHERE stripe_customer_id = :cid"),
            {"tier": tier, "cid": customer_id},
        )
        await db.commit()
    log_debug("SUBSCRIPTION_UPDATED", {"customer_id": customer_id, "tier": tier})


def _resolve_tier(price_id: str) -> str:
    s = get_settings()
    if price_id == s.stripe_price_command:
        return "command"
    if price_id == s.stripe_price_respond:
        return "respond"
    return "scout"
