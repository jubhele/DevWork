-- 003_subscribers.sql
-- Subscriber (tenant) table

CREATE TABLE IF NOT EXISTS subscribers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               TEXT NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    company_name        TEXT NOT NULL,
    company_reg         TEXT,                      -- SA Companies and Intellectual Property Commission number
    csd_number          TEXT,                      -- Central Supplier Database number
    bbbee_level         INTEGER,                   -- 1-8
    bbbee_expiry        DATE,
    cidb_grade          TEXT,                      -- e.g. '5CE', '7GB'
    psira_number        TEXT,                      -- PSIRA registration (security companies)
    geographic_reach    TEXT[] NOT NULL DEFAULT ARRAY['national'],
    service_lines       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    sectors             TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    stripe_customer_id  TEXT,
    plan_tier           TEXT NOT NULL DEFAULT 'scout', -- 'scout' | 'respond' | 'command'
    plan_active         BOOLEAN NOT NULL DEFAULT FALSE,
    plan_activated_at   TIMESTAMPTZ,
    onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers (email);
CREATE INDEX IF NOT EXISTS idx_subscribers_plan_tier ON subscribers (plan_tier, plan_active);

COMMENT ON TABLE subscribers IS 'GovTender subscribers (multi-tenant; one row per company)';
