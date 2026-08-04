from __future__ import annotations
from datetime import datetime, date
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Subscribers ───────────────────────────────────────────────────────────────

class SubscriberProfile(BaseModel):
    id: UUID
    email: str
    company_name: str
    company_reg: str | None
    csd_number: str | None
    bbbee_level: int | None
    bbbee_expiry: date | None
    cidb_grade: str | None
    psira_number: str | None
    geographic_reach: list[str]
    service_lines: list[str]
    sectors: list[str]
    plan_tier: str
    plan_active: bool
    onboarding_complete: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    company_name: str | None = None
    csd_number: str | None = None
    bbbee_level: int | None = None
    bbbee_expiry: date | None = None
    cidb_grade: str | None = None
    psira_number: str | None = None
    geographic_reach: list[str] | None = None
    service_lines: list[str] | None = None
    sectors: list[str] | None = None


# ── Tenders ───────────────────────────────────────────────────────────────────

class TenderSummary(BaseModel):
    id: UUID
    title: str
    issuing_entity: str
    estimated_value: Decimal | None
    closing_date: datetime | None
    source_portal: str
    geographic_scope: str
    score: int | None = None
    reason: str | None = None

    class Config:
        from_attributes = True


class TenderListResponse(BaseModel):
    tenders: list[dict[str, Any]]
    page: int
    page_size: int


class TenderDetail(BaseModel):
    id: UUID
    title: str
    description: str | None
    issuing_entity: str
    estimated_value: Decimal | None
    closing_date: datetime | None
    source_portal: str
    ref_number: str
    unspsc_code: str | None
    cidb_grade: str | None
    bbbee_level: int | None
    geographic_scope: str
    required_docs: list[Any]
    source_url: str | None
    score: int | None = None
    reason: str | None = None

    class Config:
        from_attributes = True


# ── Proposals ─────────────────────────────────────────────────────────────────

class GenerateProposalRequest(BaseModel):
    tender_id: str


class ProposalResponse(BaseModel):
    proposal_id: str | None = None
    id: UUID | None = None
    status: str
    docx_path: str | None = None
    pdf_path: str | None = None
    submission_ref: str | None = None
    message: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
