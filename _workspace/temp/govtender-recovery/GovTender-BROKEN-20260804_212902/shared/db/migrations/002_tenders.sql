-- 002_tenders.sql
-- Core tender table

CREATE TABLE IF NOT EXISTS tenders (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_portal    TEXT NOT NULL,       -- 'etenders' | 'cidb' | 'sita' | 'eskom' | ...
    ref_number       TEXT NOT NULL,
    title            TEXT NOT NULL,
    description      TEXT,
    issuing_entity   TEXT NOT NULL,
    estimated_value  NUMERIC(15, 2),
    currency         TEXT NOT NULL DEFAULT 'ZAR',
    closing_date     TIMESTAMPTZ,
    published_date   TIMESTAMPTZ,
    unspsc_code      TEXT,
    cidb_grade       TEXT,
    bbbee_level      INTEGER,
    geographic_scope TEXT NOT NULL DEFAULT 'national',  -- 'national' | 'provincial:GP' | 'municipal:COJ'
    required_docs    JSONB DEFAULT '[]'::jsonb,
    pre_qual_criteria JSONB DEFAULT '{}'::jsonb,
    source_url       TEXT,
    raw_html         TEXT,
    crawled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (source_portal, ref_number)
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_tenders_title_trgm
    ON tenders USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tenders_description_trgm
    ON tenders USING GIN (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tenders_closing_date
    ON tenders (closing_date);

CREATE INDEX IF NOT EXISTS idx_tenders_source_portal
    ON tenders (source_portal);

COMMENT ON TABLE tenders IS 'Normalised tender records crawled from all SA government portals';
