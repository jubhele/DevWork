from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_subscriber
from api.db import get_db
from api.debug import log_debug
from shared.types.schemas import TenderListResponse, TenderDetail

router = APIRouter()


@router.get("", response_model=TenderListResponse)
async def list_tenders(
    min_score: int = Query(default=60, ge=0, le=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    subscriber: dict = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
) -> TenderListResponse:
    """Return matched tenders for the authenticated subscriber, ordered by score desc."""
    subscriber_id = subscriber["sub"]
    log_debug("TENDERS_LIST", {"subscriber_id": subscriber_id, "min_score": min_score, "page": page})

    offset = (page - 1) * page_size

    # Raw SQL via text() until ORM models are wired — safe parameterised query
    from sqlalchemy import text
    result = await db.execute(
        text("""
            SELECT t.id, t.title, t.issuing_entity, t.estimated_value,
                   t.closing_date, t.source_portal, t.geographic_scope,
                   tm.score, tm.reason
            FROM tenders t
            JOIN tender_matches tm ON tm.tender_id = t.id
            WHERE tm.subscriber_id = :subscriber_id
              AND tm.score >= :min_score
              AND (t.closing_date IS NULL OR t.closing_date > NOW())
            ORDER BY tm.score DESC, t.closing_date ASC
            LIMIT :limit OFFSET :offset
        """),
        {"subscriber_id": subscriber_id, "min_score": min_score, "limit": page_size, "offset": offset},
    )
    rows = result.mappings().all()
    log_debug("TENDERS_LIST_RESULT", {"count": len(rows)})
    return {"tenders": [dict(r) for r in rows], "page": page, "page_size": page_size}


@router.get("/{tender_id}", response_model=TenderDetail)
async def get_tender(
    tender_id: str,
    subscriber: dict = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
) -> TenderDetail:
    """Return full tender detail including match reason for this subscriber."""
    from sqlalchemy import text
    result = await db.execute(
        text("""
            SELECT t.*, tm.score, tm.reason
            FROM tenders t
            LEFT JOIN tender_matches tm
                ON tm.tender_id = t.id AND tm.subscriber_id = :subscriber_id
            WHERE t.id = :tender_id
        """),
        {"tender_id": tender_id, "subscriber_id": subscriber["sub"]},
    )
    row = result.mappings().first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Tender not found")
    return dict(row)
