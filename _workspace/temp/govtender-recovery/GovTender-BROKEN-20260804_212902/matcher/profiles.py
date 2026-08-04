"""
SubscriberProfile — Pydantic model used by the matcher.
Loaded from the subscribers table and passed into the scoring prompt.
"""
from __future__ import annotations

from pydantic import BaseModel


class SubscriberProfile(BaseModel):
    id: str
    company_name: str
    service_lines: list[str]
    sectors: list[str]
    geographic_reach: list[str]
    bbbee_level: int | None = None
    cidb_grade: str | None = None
    psira_number: str | None = None
    plan_tier: str = "scout"

    @classmethod
    def from_db_row(cls, row: dict) -> "SubscriberProfile":
        return cls(
            id=str(row["id"]),
            company_name=row.get("company_name", ""),
            service_lines=row.get("service_lines") or [],
            sectors=row.get("sectors") or [],
            geographic_reach=row.get("geographic_reach") or ["national"],
            bbbee_level=row.get("bbbee_level"),
            cidb_grade=row.get("cidb_grade"),
            psira_number=row.get("psira_number"),
            plan_tier=row.get("plan_tier", "scout"),
        )

    def to_prompt_text(self) -> str:
        lines = [
            f"Company: {self.company_name}",
            f"Service lines: {', '.join(self.service_lines) or 'not specified'}",
            f"Sectors: {', '.join(self.sectors) or 'not specified'}",
            f"Geographic reach: {', '.join(self.geographic_reach)}",
            f"B-BBEE level: {self.bbbee_level or 'not specified'}",
            f"CIDB grade: {self.cidb_grade or 'N/A'}",
        ]
        if self.psira_number:
            lines.append(f"PSIRA registration: {self.psira_number}")
        return "\n".join(lines)
