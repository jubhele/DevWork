"""
SITA eTender Portal crawler — sita.co.za
State Information Technology Agency — ICT and technology tenders for government.
Highly relevant to Astute Insights (data engineering, analytics, systems integration).
Static HTML — BeautifulSoup sufficient.
"""
from __future__ import annotations

import asyncio

import httpx
from bs4 import BeautifulSoup

from api.debug import log_debug
from crawler.celery_app import app
from crawler.normaliser import Normaliser

_BASE_URL = "https://www.sita.co.za"
_TENDER_LIST_URL = f"{_BASE_URL}/tenders/open-bids"
_PORTAL_NAME = "sita"
_HEADERS = {
    "User-Agent": (
        "GovTender/0.1 (+https://govtender.co.za/bot) "
        "Mozilla/5.0 (compatible; GovTenderBot/0.1)"
    )
}

normaliser = Normaliser()


async def _crawl_page(page: int = 1) -> list[dict]:
    params = {"page": page}
    async with httpx.AsyncClient(headers=_HEADERS, timeout=30) as client:
        response = await client.get(_TENDER_LIST_URL, params=params)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "lxml")
    rows = []

    # SITA renders tenders in article or div blocks — adapt selector to live portal structure
    for item in soup.select(".views-row, article.tender-item, tr.tender-row"):
        try:
            title_el = item.select_one("h3 a, .views-field-title a, td.title a")
            if not title_el:
                continue

            href = title_el.get("href", "")
            detail_url = f"{_BASE_URL}{href}" if href.startswith("/") else href

            ref_el = item.select_one(".views-field-field-bid-number, td.bid-number")
            closing_el = item.select_one(".views-field-field-closing-date, td.closing-date")
            entity_el = item.select_one(".views-field-field-department, td.department")

            rows.append({
                "title": title_el.get_text(strip=True),
                "ref_number": ref_el.get_text(strip=True) if ref_el else "",
                "issuing_entity": entity_el.get_text(strip=True) if entity_el else "SITA",
                "closing_date": closing_el.get_text(strip=True) if closing_el else None,
                "source_url": detail_url or _TENDER_LIST_URL,
            })
        except Exception as exc:
            log_debug("SITA_PARSE_ERROR", {"error": str(exc)})
            continue

    return rows


async def _run_crawl() -> int:
    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    ingested = 0
    page = 1

    while True:
        log_debug("CRAWL_PAGE", {"portal": _PORTAL_NAME, "page": page})
        rows = await _crawl_page(page)
        if not rows:
            break

        for raw in rows:
            try:
                tender = normaliser.normalize(raw, _PORTAL_NAME)
                if not tender.ref_number or not tender.title:
                    continue

                async with AsyncSessionLocal() as db:
                    await db.execute(
                        text("""
                            INSERT INTO tenders (
                                source_portal, ref_number, title, description,
                                issuing_entity, closing_date,
                                geographic_scope, required_docs, source_url
                            ) VALUES (
                                :source_portal, :ref_number, :title, :description,
                                :issuing_entity, :closing_date,
                                :geographic_scope, :required_docs::jsonb, :source_url
                            )
                            ON CONFLICT (source_portal, ref_number) DO NOTHING
                        """),
                        {
                            "source_portal": tender.source_portal,
                            "ref_number": tender.ref_number,
                            "title": tender.title,
                            "description": tender.description,
                            "issuing_entity": tender.issuing_entity,
                            "closing_date": tender.closing_date,
                            "geographic_scope": tender.geographic_scope,
                            "required_docs": __import__("json").dumps(tender.required_docs),
                            "source_url": tender.source_url,
                        },
                    )
                    await db.commit()
                    ingested += 1
            except Exception as exc:
                log_debug("SITA_INGEST_ERROR", {"error": str(exc)})

        page += 1
        if page >= 50:
            break

    log_debug("CRAWL_COMPLETE", {"portal": _PORTAL_NAME, "ingested": ingested})
    return ingested


@app.task(name="crawler.portals.sita.crawl_sita")
def crawl_sita() -> dict:
    """Celery task: crawl SITA eTender portal and persist new tenders to DB."""
    log_debug("TASK_START", {"task": "crawl_sita"})
    count = asyncio.run(_run_crawl())
    log_debug("TASK_COMPLETE", {"task": "crawl_sita", "ingested": count})
    return {"portal": _PORTAL_NAME, "ingested": count}
