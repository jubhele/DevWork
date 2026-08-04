"""
SQLAlchemy ORM models — mirror of the DB schema in shared/db/migrations/.
All tables are reflected here for use by FastAPI endpoints and Celery tasks.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    BigInteger, Boolean, Date, DateTime, ForeignKey, Integer,
    Numeric, String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from api.db import Base


class Tender(Base):
    __tablename__ = "tenders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_portal: Mapped[str] = mapped_column(String, nullable=False)
    ref_number: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    issuing_entity: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_value: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    currency: Mapped[str] = mapped_column(String(10), default="ZAR")
    closing_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    published_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    unspsc_code: Mapped[str | None] = mapped_column(String(50))
    cidb_grade: Mapped[str | None] = mapped_column(String(20))
    bbbee_level: Mapped[int | None] = mapped_column(Integer)
    geographic_scope: Mapped[str] = mapped_column(String(100), default="national")
    required_docs: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    pre_qual_criteria: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    source_url: Mapped[str | None] = mapped_column(Text)
    raw_html: Mapped[str | None] = mapped_column(Text)
    crawled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("source_portal", "ref_number"),)

    matches: Mapped[list["TenderMatch"]] = relationship("TenderMatch", back_populates="tender")
    proposals: Mapped[list["Proposal"]] = relationship("Proposal", back_populates="tender")


class Subscriber(Base):
    __tablename__ = "subscribers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(Text, nullable=False)
    company_reg: Mapped[str | None] = mapped_column(String(100))
    csd_number: Mapped[str | None] = mapped_column(String(100))
    bbbee_level: Mapped[int | None] = mapped_column(Integer)
    bbbee_expiry: Mapped[date | None] = mapped_column(Date)
    cidb_grade: Mapped[str | None] = mapped_column(String(20))
    psira_number: Mapped[str | None] = mapped_column(String(50))
    geographic_reach: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    service_lines: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    sectors: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(100))
    plan_tier: Mapped[str] = mapped_column(String(20), default="scout")
    plan_active: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    documents: Mapped[list["SubscriberDocument"]] = relationship("SubscriberDocument", back_populates="subscriber")
    matches: Mapped[list["TenderMatch"]] = relationship("TenderMatch", back_populates="subscriber")
    proposals: Mapped[list["Proposal"]] = relationship("Proposal", back_populates="subscriber")
    credentials: Mapped[list["PortalCredential"]] = relationship("PortalCredential", back_populates="subscriber")


class SubscriberDocument(Base):
    __tablename__ = "subscriber_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscriber_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subscribers.id", ondelete="CASCADE"))
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False)
    content_chunk: Mapped[str] = mapped_column(Text, nullable=False)
    # embedding column defined in SQL with pgvector — not typed here to avoid pgvector ORM dep
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    subscriber: Mapped["Subscriber"] = relationship("Subscriber", back_populates="documents")


class TenderMatch(Base):
    __tablename__ = "tender_matches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenders.id", ondelete="CASCADE"))
    subscriber_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subscribers.id", ondelete="CASCADE"))
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    included_in_digest: Mapped[bool] = mapped_column(Boolean, default=False)
    scored_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("tender_id", "subscriber_id"),)

    tender: Mapped["Tender"] = relationship("Tender", back_populates="matches")
    subscriber: Mapped["Subscriber"] = relationship("Subscriber", back_populates="matches")


class Proposal(Base):
    __tablename__ = "proposals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenders.id", ondelete="CASCADE"))
    subscriber_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subscribers.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(30), default="draft")
    docx_path: Mapped[str | None] = mapped_column(Text)
    pdf_path: Mapped[str | None] = mapped_column(Text)
    submission_ref: Mapped[str | None] = mapped_column(String(200))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tender: Mapped["Tender"] = relationship("Tender", back_populates="proposals")
    subscriber: Mapped["Subscriber"] = relationship("Subscriber", back_populates="proposals")


class PortalCredential(Base):
    __tablename__ = "portal_credentials"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscriber_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subscribers.id", ondelete="CASCADE"))
    portal: Mapped[str] = mapped_column(String(50), nullable=False)
    username_enc: Mapped[str] = mapped_column(Text, nullable=False)
    password_enc: Mapped[str] = mapped_column(Text, nullable=False)
    nonce: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (UniqueConstraint("subscriber_id", "portal"),)

    subscriber: Mapped["Subscriber"] = relationship("Subscriber", back_populates="credentials")


class AiUsage(Base):
    __tablename__ = "ai_usage"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model: Mapped[str] = mapped_column(String(50), nullable=False)
    purpose: Mapped[str] = mapped_column(String(50), nullable=False)
    subscriber_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("subscribers.id", ondelete="SET NULL"), nullable=True)
    tokens_in: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cost_zar: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
