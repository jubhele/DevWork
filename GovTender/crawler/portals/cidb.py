"""
CIDB eTender Portal crawler — cidb.org.za
Construction Industry Development Board — construction and infrastructure tenders.
Static HTML portal; BeautifulSoup is sufficient (no JS rendering needed).
"""
from __future__ import annotations

import asyncio

import httpx
from bs4 import BeautifulSoup

from api.debug import log_debug
from crawler.celery_app import app
from crawler.normaliser import Normaliser

_BASE_URL = "https://www.cidb.org.za"
_TENDER_LIST_URL = f"{_BASE_URL}/tenders"
_PORTAL_NAME = "cidb"
_HEADERS = {
    "User-Agent": (
        "GovTender/0.1 (+https://govtender.co.za/bot) "
        "Mozilla/5.0 (compatible; GovTenderBot/0.1)"
    )
}

normaliser = Normaliser()


async def _crawl_static(page: int = 0) -> list[dict]:
    """Fetch one page of CIDB tender listings via httpx (static HTML)."""
    params = {"page": page}
    async with httpx.AsyncClient(headers=_HEADERS, timeout=30) as client:
        response = await client.get(_TENDER_LIST_URL, params=params)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "lxml")
    rows = []

    for row in soup.select("table.views-table tbody tr"):
        cols = row.select("td")
        if len(cols) < 4:
            continue
        try:
            title_el = cols[0].select_one("a")
            href = title_el.get("href", "") if title_el else ""
            detail_url = f"{_BASE_URL}{href}" if href.startswith("/") else href

            rows.append({
                "title": cols[0].get_text(strip=True),
                "ref_number": cols[1].get_text(strip=True),
                "issuing_entity": cols[2].get_text(strip=True),
                "closing_date": cols[3].get_text(strip=True),
                "source_url": detail_url or _TENDER_LIST_URL,
                "cidb_grade": cols[4].get_text(strip=True) if len(cols) > 4 else None,
            })
        except (IndexError, AttributeError) as exc:
            log_debug("CIDB_PARSE_ERROR", {"error": str(exc)})
            continue

    return rows


async def _run_crawl() -> int:
    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    ingested = 0
    page = 0

    while True:
        log_debug("CRAWL_PAGE", {"portal": _PORTAL_NAME, "page": page})
        rows = await _crawl_static(page)
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
                                issuing_entity, estimated_value, closing_date,
                                cidb_grade, geographic_scope, required_docs, source_url
                            ) VALUES (
                                :source_portal, :ref_number, :title, :description,
                                :issuing_entity, :estimated_value, :closing_date,
                                :cidb_grade, :geographic_scope, :required_docs::jsonb, :source_url
                            )
                            ON CONFLICT (source_portal, ref_number) DO NOTHING
                        """),
                        {
                            "source_portal": tender.source_portal,
                            "ref_number": tender.ref_number,
                            "title": tender.title,
                            "description": tender.description,
                            "issuing_entity": tender.issuing_entity,
                            "estimated_value": float(tender.estimated_value) if tender.estimated_value else None,
                            "closing_date": tender.closing_date,
                            "cidb_grade": tender.cidb_grade,
                            "geographic_scope": tender.geographic_scope,
                            "required_docs": __import__("json").dumps(tender.required_docs),
                            "source_url": tender.source_url,
                        },
                    )
                    await db.commit()
                    ingested += 1
            except Exception as exc:
                log_debug("CIDB_INGEST_ERROR", {"error": str(exc)})

        page += 1
        # Safety: stop after 50 pages to avoid infinite loops on portal changes
        if page >= 50:
            break

    log_debug("CRAWL_COMPLETE", {"portal": _PORTAL_NAME, "ingested": ingested})
    return ingested


@app.task(name="crawler.portals.cidb.crawl_cidb")
def crawl_cidb() -> dict:
    """Celery task: crawl CIDB eTender portal and persist new tenders to DB."""
    log_debug("TASK_START", {"task": "crawl_cidb"})
    count = asyncio.run(_run_crawl())
    log_debug("TASK_COMPLETE", {"task": "crawl_cidb", "ingested": count})
    return {"portal": _PORTAL_NAME, "ingested": count}
