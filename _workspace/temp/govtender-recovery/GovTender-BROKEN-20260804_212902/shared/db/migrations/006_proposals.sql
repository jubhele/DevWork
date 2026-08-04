-- 006_proposals.sql
-- Generated proposals

CREATE TABLE IF NOT EXISTS proposals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id       UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    subscriber_id   UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'draft',
                    -- 'draft' | 'ready' | 'submitted' | 'awarded' | 'not_awarded'
    docx_path       TEXT,
    pdf_path        TEXT,
    submission_ref  TEXT,
    submitted_at    TIMESTAMPTZ,
    outcome_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_subscriber
    ON proposals (subscriber_id, status, created_at DESC);

COMMENT ON TABLE proposals IS 'Generated and submitted tender proposals; one per (tender, subscriber) per generation';
