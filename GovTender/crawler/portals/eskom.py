"""
Eskom supplier portal crawler — eskomsupplierzone.com
Eskom publishes tenders via a separate supplier zone portal.
Uses Playwright (JS-rendered listing with pagination).
"""
from __future__ import annotations

import re
from typing import AsyncIterator

from bs4 import BeautifulSoup

from api.debug import log_debug
from crawler.base import BaseCrawler
from crawler.celery_app import app
from crawler.normaliser import Normaliser

_BASE_URL = "https://www.eskomsupplierzone.com"
_TENDER_URL = f"{_BASE_URL}/tenders/open-tenders"
_PORTAL_NAME = "eskom"

normaliser = Normaliser()


class EskomCrawler(BaseCrawler):
    portal_name = _PORTAL_NAME
    min_delay_s = 3.0
    max_delay_s = 6.0

    async def crawl(self) -> AsyncIterator[dict]:
        log_debug("CRAWL_START", {"portal": _PORTAL_NAME, "url": _TENDER_URL})
        page = 1
        total = 0

        while True:
            url = f"{_TENDER_URL}?page={page}"
            await self._goto(url, wait_for=".tender-list, .tender-item, table")

            html = await self._page.content()
            rows = _parse_listing(html)

            if not rows:
                log_debug("CRAWL_DONE", {"portal": _PORTAL_NAME, "pages": page, "total": total})
                break

            for row in rows:
                detail_url = row.get("detail_url")
                if detail_url:
                    await self._goto(detail_url)
                    detail_html = await self._page.content()
                    row.update(_parse_detail(detail_html))
                    row["source_url"] = detail_url

                try:
                    tender = normaliser.normalize(row, source_portal=_PORTAL_NAME)
                    yield tender
                    total += 1
                    log_debug("CRAWL_TENDER", {"portal": _PORTAL_NAME, "ref": row.get("ref_number"), "total": total})
                except Exception as exc:
                    log_debug("CRAWL_NORM_ERROR", {"portal": _PORTAL_NAME, "row": str(row)[:200], "error": str(exc)})

            page += 1


def _parse_listing(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    rows = []

    for row in soup.select("tr[class*='tender'], .tender-item, .tender-row"):
        cols = row.find_all(["td", "div"])
        if len(cols) < 3:
            continue
        link = row.find("a", href=True)
        href = link["href"] if link else None
        rows.append({
            "ref_number": _text(cols[0]),
            "title": _text(cols[1]),
            "closing_date_raw": _text(cols[2]),
            "detail_url": f"{_BASE_URL}{href}" if href and href.startswith("/") else href,
            "issuing_entity": "Eskom Holdings SOC Ltd",
        })

    return [r for r in rows if r.get("ref_number") or r.get("title")]


def _parse_detail(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    result: dict = {}

    for label_el in soup.select(".field-label, th, .label"):
        label = label_el.get_text(strip=True).lower()
        value_el = label_el.find_next_sibling() or label_el.find_parent()
        value = value_el.get_text(strip=True) if value_el else ""

        if "description" in label or "scope" in label:
            result["description"] = value
        elif "value" in label or "estimate" in label:
            result["estimated_value_raw"] = value
        elif "cidb" in label:
            result["cidb_grade_raw"] = value
        elif "document" in label or "requirement" in label:
            result.setdefault("required_docs_raw", []).append(value)

    return result


def _text(el) -> str:
    return el.get_text(strip=True) if el else ""


@app.task(name="crawler.portals.eskom.run")
def run() -> dict:
    import asyncio

    async def _run() -> int:
        from api.db import AsyncSessionLocal
        from sqlalchemy import text

        count = 0
        async with EskomCrawler() as crawler:
            async for tender in crawler.crawl():
                async with AsyncSessionLocal() as db:
                    await db.execute(
                        text("""
                            INSERT INTO tenders (
                                source_portal, ref_number, title, description,
                                issuing_entity, estimated_value, closing_date,
                                geographic_scope, required_docs, source_url, raw_html
                            ) VALUES (
                                :source_portal, :ref_number, :title, :description,
                                :issuing_entity, :estimated_value, :closing_date,
                                :geographic_scope, :required_docs, :source_url, :raw_html
                            )
                            ON CONFLICT (source_portal, ref_number) DO NOTHING
                        """),
                        tender,
                    )
                    await db.commit()
                count += 1

        log_debug("CRAWL_STORED", {"portal": _PORTAL_NAME, "count": count})
        return count

    return {"portal": _PORTAL_NAME, "stored": asyncio.run(_run())}
