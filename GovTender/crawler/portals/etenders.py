"""
eTenders crawler — etenders.gov.za
National Treasury's electronic tender portal. Largest volume of national tenders.

Uses Playwright because the tender listing is React-rendered.
Respects robots.txt: 2-5s delay between pages, identifies as GovTenderBot.
"""
from __future__ import annotations

import asyncio
from typing import AsyncIterator

from bs4 import BeautifulSoup

from api.debug import log_debug
from crawler.base import BaseCrawler
from crawler.celery_app import app
from crawler.normaliser import Normaliser

_BASE_URL = "https://www.etenders.gov.za"
_TENDER_LIST_URL = f"{_BASE_URL}/content/opportunities"
_PORTAL_NAME = "etenders"

normaliser = Normaliser()


class ETendersCrawler(BaseCrawler):
    portal_name = _PORTAL_NAME
    min_delay_s = 2.0
    max_delay_s = 5.0

    async def crawl(self) -> AsyncIterator[dict]:
        page_num = 0
        total = 0

        log_debug("CRAWL_START", {"portal": _PORTAL_NAME, "url": _TENDER_LIST_URL})

        while True:
            url = f"{_TENDER_LIST_URL}?page={page_num}"
            await self._goto(url, wait_for=".view-content")

            html = await self._page.content()
            rows = self._parse_listing_page(html)

            if not rows:
                log_debug("CRAWL_END_EMPTY_PAGE", {"portal": _PORTAL_NAME, "page": page_num, "total": total})
                break

            for row in rows:
                detail_url = row.get("detail_url")
                if detail_url:
                    detail = await self._fetch_detail(detail_url)
                    row.update(detail)
                yield row
                total += 1

            log_debug("CRAWL_PAGE_DONE", {"portal": _PORTAL_NAME, "page": page_num, "page_count": len(rows), "total": total})

            # Check for next page link
            soup = BeautifulSoup(html, "lxml")
            next_link = soup.select_one("li.pager__item--next a")
            if not next_link:
                break
            page_num += 1

        log_debug("CRAWL_COMPLETE", {"portal": _PORTAL_NAME, "total_tenders": total})

    def _parse_listing_page(self, html: str) -> list[dict]:
        """Parse the eTenders listing page HTML into raw tender dicts."""
        soup = BeautifulSoup(html, "lxml")
        rows = []

        for item in soup.select(".views-row"):
            try:
                title_el = item.select_one(".views-field-title a")
                ref_el = item.select_one(".views-field-field-reference-number")
                entity_el = item.select_one(".views-field-field-department")
                closing_el = item.select_one(".views-field-field-closing-date")

                if not title_el:
                    continue

                href = title_el.get("href", "")
                detail_url = f"{_BASE_URL}{href}" if href.startswith("/") else href

                rows.append({
                    "title": title_el.get_text(strip=True),
                    "ref_number": ref_el.get_text(strip=True) if ref_el else "",
                    "issuing_entity": entity_el.get_text(strip=True) if entity_el else "National",
                    "closing_date": closing_el.get_text(strip=True) if closing_el else None,
                    "detail_url": detail_url,
                    "source_url": detail_url,
                })
            except Exception as exc:
                log_debug("CRAWL_PARSE_ERROR", {"portal": _PORTAL_NAME, "error": str(exc)})
                continue

        return rows

    async def _fetch_detail(self, url: str) -> dict:
        """Fetch the detail page of a single tender to get description + required docs."""
        try:
            await self._goto(url, wait_for=".field--name-body")
            html = await self._page.content()
            soup = BeautifulSoup(html, "lxml")

            desc_el = soup.select_one(".field--name-body")
            value_el = soup.select_one(".field--name-field-estimated-value")
            docs_el = soup.select_one(".field--name-field-required-documents")

            required_docs = []
            if docs_el:
                required_docs = [li.get_text(strip=True) for li in docs_el.select("li")]

            return {
                "description": desc_el.get_text(strip=True) if desc_el else None,
                "estimated_value": value_el.get_text(strip=True) if value_el else None,
                "required_docs": required_docs,
            }
        except Exception as exc:
            log_debug("CRAWL_DETAIL_ERROR", {"portal": _PORTAL_NAME, "url": url, "error": str(exc)})
            return {}


async def _run_crawl() -> int:
    """Run the full eTenders crawl and persist to DB. Returns number of tenders ingested."""
    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    ingested = 0
    async with ETendersCrawler() as crawler:
        async for raw in crawler.crawl():
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
                                unspsc_code, cidb_grade, bbbee_level,
                                geographic_scope, required_docs, source_url
                            ) VALUES (
                                :source_portal, :ref_number, :title, :description,
                                :issuing_entity, :estimated_value, :closing_date,
                                :unspsc_code, :cidb_grade, :bbbee_level,
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
                            "estimated_value": float(tender.estimated_value) if tender.estimated_value else None,
                            "closing_date": tender.closing_date,
                            "unspsc_code": tender.unspsc_code,
                            "cidb_grade": tender.cidb_grade,
                            "bbbee_level": tender.bbbee_level,
                            "geographic_scope": tender.geographic_scope,
                            "required_docs": __import__("json").dumps(tender.required_docs),
                            "source_url": tender.source_url,
                        },
                    )
                    await db.commit()
                    ingested += 1
                    log_debug("DB_WRITE", {"table": "tenders", "ref": tender.ref_number, "portal": _PORTAL_NAME})
            except Exception as exc:
                log_debug("CRAWL_INGEST_ERROR", {"error": str(exc)})

    return ingested


@app.task(name="crawler.portals.etenders.crawl_etenders")
def crawl_etenders() -> dict:
    """Celery task: crawl eTenders and persist new tenders to DB."""
    import asyncio
    log_debug("TASK_START", {"task": "crawl_etenders"})
    count = asyncio.run(_run_crawl())
    log_debug("TASK_COMPLETE", {"task": "crawl_etenders", "ingested": count})
    return {"portal": _PORTAL_NAME, "ingested": count}
