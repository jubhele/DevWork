from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_subscriber, require_tier
from api.db import get_db
from api.debug import log_debug
from shared.types.schemas import GenerateProposalRequest, ProposalResponse

router = APIRouter()


@router.post("/generate", response_model=ProposalResponse)
async def generate_proposal(
    body: GenerateProposalRequest,
    background_tasks: BackgroundTasks,
    subscriber: dict = Depends(require_tier("respond")),
    db: AsyncSession = Depends(get_db),
) -> ProposalResponse:
    """Trigger async proposal generation for a tender. Returns proposal record immediately."""
    import uuid
    from sqlalchemy import text

    subscriber_id = subscriber["sub"]
    proposal_id = str(uuid.uuid4())

    log_debug("PROPOSAL_GENERATE_START", {
        "proposal_id": proposal_id,
        "tender_id": body.tender_id,
        "subscriber_id": subscriber_id,
    })

    # Create proposal record in 'draft' status
    await db.execute(
        text("""
            INSERT INTO proposals (id, tender_id, subscriber_id, status)
            VALUES (:id, :tender_id, :subscriber_id, 'draft')
        """),
        {"id": proposal_id, "tender_id": body.tender_id, "subscriber_id": subscriber_id},
    )
    await db.commit()

    # Queue actual generation — runs in background so API returns immediately
    background_tasks.add_task(_run_generation, proposal_id, body.tender_id, subscriber_id)

    return {"proposal_id": proposal_id, "status": "draft", "message": "Generation queued"}


async def _run_generation(proposal_id: str, tender_id: str, subscriber_id: str) -> None:
    """Background task: calls proposal generator and updates record on completion."""
    from proposal.generator import generate
    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    log_debug("PROPOSAL_GENERATE_RUN", {"proposal_id": proposal_id})

    try:
        result = await generate(tender_id=tender_id, subscriber_id=subscriber_id)
        async with AsyncSessionLocal() as db:
            await db.execute(
                text("""
                    UPDATE proposals
                    SET status = 'ready', docx_path = :docx, pdf_path = :pdf, updated_at = NOW()
                    WHERE id = :id
                """),
                {"id": proposal_id, "docx": result["docx_path"], "pdf": result["pdf_path"]},
            )
            await db.commit()
        log_debug("PROPOSAL_GENERATE_COMPLETE", {"proposal_id": proposal_id, "status": "ready"})
    except Exception as exc:
        log_debug("PROPOSAL_GENERATE_ERROR", {"proposal_id": proposal_id, "error": str(exc)})


@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(
    proposal_id: str,
    subscriber: dict = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
) -> ProposalResponse:
    from sqlalchemy import text

    result = await db.execute(
        text("SELECT * FROM proposals WHERE id = :id AND subscriber_id = :sid"),
        {"id": proposal_id, "sid": subscriber["sub"]},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return dict(row)
