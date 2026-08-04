"""
RAG layer — subscriber document embeddings via pgvector.

Stores chunked subscriber documents as vector embeddings.
Retrieves the most relevant chunks at proposal-generation time.
"""
from __future__ import annotations

import math
from typing import Any

import anthropic

from api.config import get_settings
from api.debug import log_debug

settings = get_settings()

_EMBED_MODEL = "text-embedding-3-small"
_EMBED_DIM = 1536
_CHUNK_SIZE = 400   # tokens (approximate — use character split)
_CHUNK_CHARS = 1500  # ~400 tokens at average 3.75 chars/token
_TOP_K = 5


def _chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks for embedding."""
    chunks = []
    step = _CHUNK_CHARS - 200  # 200-char overlap
    for i in range(0, len(text), step):
        chunk = text[i : i + _CHUNK_CHARS].strip()
        if chunk:
            chunks.append(chunk)
    return chunks


async def embed_and_store(
    subscriber_id: str,
    filename: str,
    doc_type: str,
    content: str,
) -> int:
    """
    Chunk a subscriber document, embed each chunk, and store in subscriber_documents.
    Returns number of chunks stored.
    """
    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    chunks = _chunk_text(content)
    if not chunks:
        return 0

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    log_debug("RAG_EMBED_START", {
        "subscriber_id": subscriber_id,
        "filename": filename,
        "chunks": len(chunks),
    })

    stored = 0
    async with AsyncSessionLocal() as db:
        # Clear existing chunks for this document (re-upload replaces)
        await db.execute(
            text("""
                DELETE FROM subscriber_documents
                WHERE subscriber_id = :sid AND filename = :fn
            """),
            {"sid": subscriber_id, "fn": filename},
        )

        for idx, chunk in enumerate(chunks):
            try:
                response = await client.embeddings.create(
                    model=_EMBED_MODEL,
                    input=chunk,
                )
                vector = response.data[0].embedding

                await db.execute(
                    text("""
                        INSERT INTO subscriber_documents
                            (subscriber_id, filename, doc_type, content_chunk, chunk_index, embedding)
                        VALUES
                            (:sid, :fn, :dtype, :chunk, :idx, :vec::vector)
                    """),
                    {
                        "sid": subscriber_id,
                        "fn": filename,
                        "dtype": doc_type,
                        "chunk": chunk,
                        "idx": idx,
                        "vec": f"[{','.join(str(v) for v in vector)}]",
                    },
                )
                stored += 1
            except Exception as exc:
                log_debug("RAG_EMBED_ERROR", {"filename": filename, "chunk": idx, "error": str(exc)})

        await db.commit()

    log_debug("RAG_EMBED_DONE", {"subscriber_id": subscriber_id, "stored": stored})
    return stored


async def retrieve_context(
    subscriber_id: str,
    query: str,
    top_k: int = _TOP_K,
) -> list[dict[str, Any]]:
    """
    Embed the query and retrieve the top-K most similar subscriber document chunks.
    Returns list of {content_chunk, doc_type, filename, similarity}.
    """
    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    response = await client.embeddings.create(model=_EMBED_MODEL, input=query)
    query_vec = response.data[0].embedding

    log_debug("RAG_RETRIEVE", {"subscriber_id": subscriber_id, "query": query[:80]})

    vec_str = f"[{','.join(str(v) for v in query_vec)}]"

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text("""
                SELECT content_chunk, doc_type, filename,
                       1 - (embedding <=> :vec::vector) AS similarity
                FROM subscriber_documents
                WHERE subscriber_id = :sid
                ORDER BY embedding <=> :vec::vector
                LIMIT :top_k
            """),
            {"vec": vec_str, "sid": subscriber_id, "top_k": top_k},
        )
        rows = [dict(r) for r in result.mappings().all()]

    log_debug("RAG_RETRIEVED", {"count": len(rows)})
    return rows
