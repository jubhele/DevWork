"""
Tender Normaliser — maps raw scraped dicts to validated Tender Pydantic models.
Handles SA date formats, currency parsing, UNSPSC extraction, deduplication keys.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

from pydantic import BaseModel, field_validator


_SA_DATE_FORMATS = [
    "%d %B %Y",        # 21 June 2026
    "%d/%m/%Y",        # 21/06/2026
    "%Y-%m-%d",        # 2026-06-21
    "%d-%m-%Y",        # 21-06-2026
    "%B %d, %Y",       # June 21, 2026
    "%d %b %Y",        # 21 Jun 2026
]

_BBBEE_PATTERN = re.compile(r"b-?bbee\s*level\s*(\d)", re.IGNORECASE)
_CIDB_PATTERN = re.compile(r"\b(\d[A-Z]{2})\b")
_UNSPSC_PATTERN = re.compile(r"\b(\d{8})\b")  # UNSPSC codes are 8-digit numbers


class Tender(BaseModel):
    source_portal: str
    ref_number: str
    title: str
    description: str | None = None
    issuing_entity: str
    estimated_value: Decimal | None = None
    currency: str = "ZAR"
    closing_date: datetime | None = None
    published_date: datetime | None = None
    unspsc_code: str | None = None
    cidb_grade: str | None = None
    bbbee_level: int | None = None
    geographic_scope: str = "national"
    required_docs: list[str] = []
    pre_qual_criteria: dict[str, Any] = {}
    source_url: str | None = None

    @field_validator("ref_number", "title", "issuing_entity", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip() if v else v


class Normaliser:
    """Converts raw portal-scraped dicts into validated Tender models."""

    def normalize(self, raw: dict, portal: str) -> Tender:
        description = raw.get("description") or ""
        full_text = f"{raw.get('title', '')} {description}"

        return Tender(
            source_portal=portal,
            ref_number=self._clean(raw.get("ref_number", "")),
            title=self._clean(raw.get("title", "")),
            description=description or None,
            issuing_entity=self._clean(raw.get("issuing_entity", "")),
            estimated_value=self._parse_currency(raw.get("estimated_value")),
            currency="ZAR",
            closing_date=self._parse_date(raw.get("closing_date")),
            published_date=self._parse_date(raw.get("published_date")),
            unspsc_code=self._extract_unspsc(full_text) or raw.get("unspsc_code"),
            cidb_grade=self._extract_cidb(full_text) or raw.get("cidb_grade"),
            bbbee_level=self._extract_bbbee(full_text) or raw.get("bbbee_level"),
            geographic_scope=self._parse_scope(raw.get("geographic_scope", "national")),
            required_docs=raw.get("required_docs", []),
            pre_qual_criteria=raw.get("pre_qual_criteria", {}),
            source_url=raw.get("source_url"),
        )

    # ── helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _clean(value: str) -> str:
        return re.sub(r"\s+", " ", value).strip()

    @staticmethod
    def _parse_date(value: Any) -> datetime | None:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
        text = str(value).strip()
        for fmt in _SA_DATE_FORMATS:
            try:
                return datetime.strptime(text, fmt).replace(tzinfo=timezone.utc)
            except ValueError:
                continue
        return None

    @staticmethod
    def _parse_currency(value: Any) -> Decimal | None:
        if value is None:
            return None
        text = re.sub(r"[ZARzar\sR,]", "", str(value)).replace(" ", "")
        text = text.replace(",", "").strip()
        try:
            return Decimal(text)
        except InvalidOperation:
            return None

    @staticmethod
    def _extract_bbbee(text: str) -> int | None:
        m = _BBBEE_PATTERN.search(text)
        return int(m.group(1)) if m else None

    @staticmethod
    def _extract_cidb(text: str) -> str | None:
        m = _CIDB_PATTERN.search(text)
        return m.group(1) if m else None

    @staticmethod
    def _extract_unspsc(text: str) -> str | None:
        m = _UNSPSC_PATTERN.search(text)
        return m.group(1) if m else None

    @staticmethod
    def _parse_scope(raw: Any) -> str:
        if not raw:
            return "national"
        text = str(raw).lower()
        if "national" in text:
            return "national"
        # Map province abbreviations
        provinces = {"gp": "GP", "kzn": "KZN", "wc": "WC", "ec": "EC", "mp": "MP",
                     "lp": "LP", "nw": "NW", "nc": "NC", "fs": "FS"}
        for abbr, code in provinces.items():
            if abbr in text:
                return f"provincial:{code}"
        return "national"
