-- 005_tender_matches.sql
-- Claude Haiku match scores (tender x subscriber)

CREATE TABLE IF NOT EXISTS tender_matches (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id            UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    subscriber_id        UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    score                INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    reason               TEXT NOT NULL,
    included_in_digest   BOOLEAN NOT NULL DEFAULT FALSE,
    digest_sent_at       TIMESTAMPTZ,
    scored_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tender_id, subscriber_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_subscriber_score
    ON tender_matches (subscriber_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_matches_digest
    ON tender_matches (subscriber_id, included_in_digest, digest_sent_at);

COMMENT ON TABLE tender_matches IS 'Per-(tender, subscriber) match scores from Claude Haiku';
