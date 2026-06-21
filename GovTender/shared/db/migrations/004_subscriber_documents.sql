-- 004_subscriber_documents.sql
-- Subscriber capability documents with pgvector embeddings for RAG

CREATE TABLE IF NOT EXISTS subscriber_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id   UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    filename        TEXT NOT NULL,
    doc_type        TEXT NOT NULL,      -- 'company_profile' | 'cv' | 'certificate' | 'rate_card' | 'past_project'
    content_chunk   TEXT NOT NULL,      -- one semantic chunk per row
    chunk_index     INTEGER NOT NULL,   -- position in the source document
    embedding       vector(1536),       -- text-embedding-3-small dimensions
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IVFFlat index for approximate nearest neighbour search
-- Build after data is loaded: CREATE INDEX AFTER initial bulk insert
CREATE INDEX IF NOT EXISTS idx_subdocs_subscriber
    ON subscriber_documents (subscriber_id);

-- Cosine similarity index (build once subscriber_documents has > 1000 rows)
-- CREATE INDEX idx_subdocs_embedding ON subscriber_documents
--     USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE subscriber_documents IS 'Chunked + embedded capability documents for RAG retrieval at proposal time';
