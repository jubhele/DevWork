"""
Daily digest builder — assembles personalised tender match digests per subscriber.
Feeds into matcher/email.py for delivery.
"""
from __future__ import annotations

from api.debug import log_debug
from crawler.celery_app import app


async def _build_digest(subscriber_id: str) -> dict:
    """Build digest data for one subscriber. Returns {subscriber, matches}."""
    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    async with AsyncSessionLocal() as db:
        # Subscriber info
        result = await db.execute(
            text("""
                SELECT id, email, company_name, plan_tier
                FROM subscribers
                WHERE id = :sid AND plan_active = TRUE
            """),
            {"sid": subscriber_id},
        )
        sub = result.mappings().first()
        if not sub:
            return {}

        # Matches not yet included in a digest, score >= 60
        result = await db.execute(
            text("""
                SELECT t.title, t.ref_number, t.issuing_entity,
                       t.estimated_value, t.closing_date, t.source_url,
                       tm.score, tm.reason
                FROM tender_matches tm
                JOIN tenders t ON t.id = tm.tender_id
                WHERE tm.subscriber_id = :sid
                  AND tm.included_in_digest = TRUE
                  AND NOT EXISTS (
                      SELECT 1 FROM tender_matches tm2
                      WHERE tm2.tender_id = tm.tender_id
                        AND tm2.subscriber_id = tm.subscriber_id
                  )
                ORDER BY tm.score DESC
                LIMIT 20
            """),
            {"sid": subscriber_id},
        )
        matches = [dict(r) for r in result.mappings().all()]

    return {"subscriber": dict(sub), "matches": matches}


async def _run_digest() -> int:
    """Build and send digests for all active subscribers. Returns count sent."""
    from api.db import AsyncSessionLocal
    from matcher.email import send_digest_email
    from sqlalchemy import text

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text("SELECT id FROM subscribers WHERE plan_active = TRUE")
        )
        ids = [str(r[0]) for r in result.fetchall()]

    sent = 0
    for sub_id in ids:
        try:
            digest = await _build_digest(sub_id)
            if digest and digest.get("matches"):
                await send_digest_email(digest)
                sent += 1
                log_debug("DIGEST_SENT", {"subscriber_id": sub_id, "matches": len(digest["matches"])})
        except Exception as exc:
            log_debug("DIGEST_ERROR", {"subscriber_id": sub_id, "error": str(exc)})

    return sent


@app.task(name="matcher.digest.send_daily_digest")
def send_daily_digest() -> dict:
    """Celery task: build and send daily tender digest emails."""
    import asyncio
    log_debug("TASK_START", {"task": "send_daily_digest"})
    count = asyncio.run(_run_digest())
    log_debug("TASK_COMPLETE", {"task": "send_daily_digest", "sent": count})
    return {"sent": count}
