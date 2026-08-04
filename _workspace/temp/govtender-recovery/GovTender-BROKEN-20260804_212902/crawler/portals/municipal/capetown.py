"""
City of Cape Town tender crawler — capetown.gov.za
Static HTML listing. Geographic scope: municipal:CPT
"""
from __future__ import annotations

import asyncio
from typing import AsyncIterator

import httpx
from bs4 import BeautifulSoup

from api.debug import log_debug
from crawler.base import BaseCrawler
from crawler.celery_app import app
from crawler.normaliser import Normaliser

_BASE_URL = "https://www.capetown.gov.za"
_TENDER_URL = f"{_BASE_URL}/en/procurement/Pages/Tenders.aspx"
_PORTAL_NAME = "municipal_capetown"
_GEO = "municipal:CPT"
_ENTITY = "City of Cape Town Metropolitan Municipality"

normaliser = Normaliser()


class CapeTownCrawler(BaseCrawler):
    portal_name = _PORTAL_NAME
    min_delay_s = 2.0
    max_delay_s = 4.0

    async def crawl(self) -> AsyncIterator[dict]:
        log_debug("CRAWL_START", {"portal": _PORTAL_NAME, "url": _TENDER_URL})
        total = 0

        async with httpx.AsyncClient(
            headers={"User-Agent": "GovTender/0.1 (+https://govtender.co.za/bot)"},
            follow_redirects=True,
            timeout=30,
        ) as client:
            page = 1
            while True:
                url = f"{_TENDER_URL}&page={page}" if page > 1 else _TENDER_URL
                try:
                    r = await client.get(url)
                    r.raise_for_status()
                except Exception as exc:
                    log_debug("CRAWL_HTTP_ERROR", {"portal": _PORTAL_NAME, "error": str(exc)})
                    break

                rows = _parse_listing(r.text)
                if not rows:
                    break

                for row in rows:
                    detail_url = row.get("detail_url")
                    if detail_url:
                        try:
                            dr = await client.get(detail_url)
                            row.update(_parse_detail(dr.text))
                            row["source_url"] = detail_url
                        except Exception:
                            pass

                    row["issuing_entity"] = _ENTITY
                    row["geographic_scope"] = _GEO

                    try:
                        tender = normaliser.normalize(row, source_portal=_PORTAL_NAME)
                        yield tender
                        total += 1
                    except Exception as exc:
                        log_debug("CRAWL_NORM_ERROR", {"portal": _PORTAL_NAME, "error": str(exc)})

                page += 1

        log_debug("CRAWL_DONE", {"portal": _PORTAL_NAME, "total": total})


def _parse_listing(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    rows = []

    for item in soup.select("table.ms-listviewtable tr, .tender-entry, .soi-row"):
        cols = item.find_all(["td", "div"])
        link = item.find("a", href=True)
        if not link or len(cols) < 2:
            continue
        href = link["href"]
        rows.append({
            "ref_number": _text(cols[0]),
            "title": _text(cols[1]),
            "closing_date_raw": _text(cols[-1]),
            "detail_url": f"{_BASE_URL}{href}" if href.startswith("/") else href,
        })

    return [r for r in rows if r.get("title")]


def _parse_detail(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    result: dict = {}
    body = soup.select_one(".ms-rtestate-field, .soi-content, .content-area")
    if body:
        result["description"] = body.get_text(separator="\n", strip=True)[:3000]
    for label in soup.select(".ms-standardheader, th, .field-label"):
        ltext = label.get_text(strip=True).lower()
        val_el = label.find_next_sibling()
        val = val_el.get_text(strip=True) if val_el else ""
        if "value" in ltext or "estimate" in ltext:
            result["estimated_value_raw"] = val
        elif "document" in ltext or "required" in ltext:
            result.setdefault("required_docs_raw", []).append(val)
    return result


def _text(el) -> str:
    return el.get_text(strip=True) if el else ""


@app.task(name="crawler.portals.municipal.capetown.run")
def run() -> dict:
    async def _run() -> int:
        from api.db import AsyncSessionLocal
        from sqlalchemy import text

        count = 0
        async with CapeTownCrawler() as crawler:
            async for tender in crawler.crawl():
                async with AsyncSessionLocal() as db:
                    await db.execute(text("""
                        INSERT INTO tenders (
                            source_portal, ref_number, title, description,
                            issuing_entity, estimated_value, closing_date,
                            geographic_scope, required_docs, source_url, raw_html
                        ) VALUES (
                            :source_portal, :ref_number, :title, :description,
                            :issuing_entity, :estimated_value, :closing_date,
                            :geographic_scope, :required_docs, :source_url, :raw_html
                        ) ON CONFLICT (source_portal, ref_number) DO NOTHING
                    """), tender)
                    await db.commit()
                count += 1
        return count

    return {"portal": _PORTAL_NAME, "stored": asyncio.run(_run())}
