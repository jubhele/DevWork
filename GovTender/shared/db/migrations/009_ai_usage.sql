-- 009_ai_usage.sql
-- AI API cost tracking table (ZAR)

CREATE TABLE IF NOT EXISTS ai_usage (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model           TEXT NOT NULL,              -- 'claude-haiku-4-5' | 'claude-sonnet-4-6'
    purpose         TEXT NOT NULL,              -- 'match' | 'proposal' | 'embed'
    subscriber_id   UUID REFERENCES subscribers(id) ON DELETE SET NULL,  -- NULL for crawl-level calls
    tokens_in       INTEGER NOT NULL DEFAULT 0,
    tokens_out      INTEGER NOT NULL DEFAULT 0,
    cost_zar        NUMERIC(10, 4) NOT NULL DEFAULT 0,  -- computed at insert time
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage (created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_subscriber ON ai_usage (subscriber_id) WHERE subscriber_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage (model);

COMMENT ON TABLE ai_usage IS 'Per-call AI API usage and cost in ZAR. Alert threshold: R90/day (~$5 at current exchange rate).';
COMMENT ON COLUMN ai_usage.cost_zar IS 'Computed from token counts * model rate, converted at time of insert. Exchange rate: ~R18/USD.';
