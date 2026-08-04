from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from api.auth import get_current_subscriber, create_token
from api.db import get_db
from api.debug import log_debug
from shared.types.schemas import SubscriberProfile, LoginRequest, TokenResponse, ProfileUpdateRequest

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    from sqlalchemy import text

    log_debug("AUTH_LOGIN_ATTEMPT", {"email": body.email})

    result = await db.execute(
        text("SELECT id, password_hash, plan_tier, plan_active FROM subscribers WHERE email = :email"),
        {"email": body.email},
    )
    row = result.mappings().first()

    if not row or not pwd_context.verify(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not row["plan_active"]:
        raise HTTPException(status_code=403, detail="Subscription inactive")

    token = create_token(str(row["id"]), row["plan_tier"])
    log_debug("AUTH_LOGIN_SUCCESS", {"subscriber_id": str(row["id"]), "tier": row["plan_tier"]})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/profile", response_model=SubscriberProfile)
async def get_profile(
    subscriber: dict = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
) -> SubscriberProfile:
    from sqlalchemy import text

    result = await db.execute(
        text("SELECT * FROM subscribers WHERE id = :id"),
        {"id": subscriber["sub"]},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return dict(row)


@router.put("/profile", response_model=SubscriberProfile)
async def update_profile(
    body: ProfileUpdateRequest,
    subscriber: dict = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
) -> SubscriberProfile:
    from sqlalchemy import text

    log_debug("PROFILE_UPDATE", {"subscriber_id": subscriber["sub"]})
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["id"] = subscriber["sub"]
    await db.execute(
        text(f"UPDATE subscribers SET {set_clause}, updated_at = NOW() WHERE id = :id"),
        updates,
    )
    await db.commit()
    return await get_profile(subscriber, db)


@router.post("/documents")
async def upload_document(
    doc_type: str,
    file: UploadFile = File(...),
    subscriber: dict = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Upload a capability document, chunk it, embed it, store in subscriber_documents."""
    from proposal.rag import embed_and_store

    log_debug("DOCUMENT_UPLOAD", {"subscriber_id": subscriber["sub"], "filename": file.filename, "doc_type": doc_type})
    content = await file.read()
    text_content = content.decode("utf-8", errors="replace")

    chunk_count = await embed_and_store(
        subscriber_id=subscriber["sub"],
        filename=file.filename,
        doc_type=doc_type,
        text=text_content,
        db=db,
    )
    log_debug("DOCUMENT_EMBEDDED", {"subscriber_id": subscriber["sub"], "chunks": chunk_count})
    return {"message": f"Stored {chunk_count} chunks from {file.filename}"}
