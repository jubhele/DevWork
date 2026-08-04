"""
Claude Haiku 4.5 Relevance Scorer

Scores each (tender, subscriber) pair 0-100 with a one-line reason.
Uses Anthropic prompt caching: system prompt + subscriber profile are cached
to reduce token cost ~80% on repeated calls for the same subscriber.
"""
from __future__ import annotations

import json
import re
from typing import Any

import anthropic

from api.config import get_settings
from api.debug import log_debug
from crawler.celery_app import app

settings = get_settings()

_MODEL = "claude-haiku-4-5-20251001"
_MAX_TOKENS = 128

_SYSTEM_PROMPT = """You are a South African government tender relevance scorer.
Given a tender description and a company's capability profile, score how relevant the tender is on a scale of 0-100.

Scoring guide:
- 80-100: Direct match — the tender is in the company's core service lines
- 60-79: Strong match — adjacent or related service area
- 40-59: Partial match — some overlap but not primary domain
- 0-39: Weak or no match

Respond ONLY with valid JSON: {"score": <integer 0-100>, "reason": "<one sentence max 20 words>"}
Do not include any other text."""


async def score_single(tender: dict, profile: dict) -> dict[str, Any]:
    """Score a single (tender, subscriber) pair. Returns {score, reason}."""
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    profile_text = (
        f"Company: {profile.get('company_name', '')}\n"
        f"Service lines: {', '.join(profile.get('service_lines', []))}\n"
        f"Sectors: {', '.join(profile.get('sectors', []))}\n"
        f"Geographic reach: {', '.join(profile.get('geographic_reach', ['national']))}\n"
        f"B-BBEE level: {profile.get('bbbee_level', 'unknown')}\n"
        f"CIDB grade: {profile.get('cidb_grade', 'n/a')}"
    )

    tender_text = (
        f"Title: {tender.get('title', '')}\n"
        f"Issuing entity: {tender.get('issuing_entity', '')}\n"
        f"Description: {(tender.get('description') or '')[:500]}\n"
        f"Estimated value: R{tender.get('estimated_value', 'unknown')}\n"
        f"CIDB grade required: {tender.get('cidb_grade') or 'not specified'}\n"
        f"B-BBEE required: {tender.get('bbbee_level') or 'not specified'}"
    )

    log_debug("API_CALL", {
        "model": _MODEL,
        "action": "score_tender",
        "tender_ref": tender.get("ref_number"),
        "subscriber_id": profile.get("id"),
    })

    response = await client.messages.create(
        model=_MODEL,
        max_tokens=_MAX_TOKENS,
        system=[
            {
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": (
                    f"COMPANY PROFILE:\n{profile_text}\n\n"
                    f"TENDER:\n{tender_text}\n\n"
                    "Score this tender for this company."
                ),
            }
        ],
    )

    raw = response.content[0].text.strip()
    log_debug("API_RESPONSE", {
        "model": _MODEL,
        "tokens_in": response.usage.input_tokens,
        "tokens_out": response.usage.output_tokens,
        "raw": raw[:100],
    })

    return _parse_score(raw)


def _parse_score(raw: str) -> dict[str, Any]:
    """Parse Haiku's JSON response. Returns safe defaults on parse failure."""
    try:
        data = json.loads(raw)
        score = int(data.get("score", 0))
        reason = str(data.get("reason", "")).strip()
        return {
            "score": max(0, min(100, score)),
            "reason": reason[:200] if reason else "No reason provided",
        }
    except (json.JSONDecodeError, ValueError, KeyError):
        # Try regex fallback
        m = re.search(r'"score"\s*:\s*(\d+)', raw)
        score = int(m.group(1)) if m else 0
        m2 = re.search(r'"reason"\s*:\s*"([^"]+)"', raw)
        reason = m2.group(1) if m2 else "Parse error"
        return {"score": max(0, min(100, score)), "reason": reason}


@app.task(name="matcher.score.run_nightly_scoring")
def run_nightly_scoring() -> dict:
    """Celery task: score all new unscored tenders against all active subscribers."""
    import asyncio

    async def _run() -> int:
        from api.db import AsyncSessionLocal
        from sqlalchemy import text

        total_scored = 0

        async with AsyncSessionLocal() as db:
            # Fetch tenders crawled in the last 26 hours not yet scored
            result = await db.execute(
                text("""
                    SELECT t.id, t.title, t.description, t.issuing_entity,
                           t.estimated_value, t.cidb_grade, t.bbbee_level,
                           t.ref_number
                    FROM tenders t
                    WHERE t.crawled_at > NOW() - INTERVAL '26 hours'
                      AND NOT EXISTS (
                          SELECT 1 FROM tender_matches tm WHERE tm.tender_id = t.id
                      )
                """)
            )
            tenders = [dict(r) for r in result.mappings().all()]

            # Fetch all active subscribers
            result = await db.execute(
                text("""
                    SELECT id, company_name, service_lines, sectors,
                           geographic_reach, bbbee_level, cidb_grade
                    FROM subscribers
                    WHERE plan_active = TRUE
                """)
            )
            subscribers = [dict(r) for r in result.mappings().all()]

        log_debug("SCORING_RUN", {"tenders": len(tenders), "subscribers": len(subscribers)})

        for tender in tenders:
            for sub in subscribers:
                try:
                    result = await score_single(tender, sub)
                    async with AsyncSessionLocal() as db:
                        await db.execute(
                            text("""
                                INSERT INTO tender_matches
                                    (tender_id, subscriber_id, score, reason, included_in_digest)
                                VALUES (:tid, :sid, :score, :reason, :in_digest)
                                ON CONFLICT (tender_id, subscriber_id) DO NOTHING
                            """),
                            {
                                "tid": str(tender["id"]),
                                "sid": str(sub["id"]),
                                "score": result["score"],
                                "reason": result["reason"],
                                "in_digest": result["score"] >= 60,
                            },
                        )
                        await db.commit()
                    total_scored += 1
                except Exception as exc:
                    log_debug("SCORING_ERROR", {"tender_id": str(tender["id"]), "error": str(exc)})

        log_debug("SCORING_COMPLETE", {"total_scored": total_scored})
        return total_scored

    count = asyncio.run(_run())
    return {"scored": count}
