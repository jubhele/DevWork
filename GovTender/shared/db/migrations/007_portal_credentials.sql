-- 007_portal_credentials.sql
-- Per-tenant encrypted portal credentials for form automation

CREATE TABLE IF NOT EXISTS portal_credentials (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id   UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    portal          TEXT NOT NULL,       -- 'etenders' | 'cidb' | 'eskom' | 'transnet' | ...
    username_enc    TEXT NOT NULL,       -- AES-256-GCM encrypted, base64 encoded
    password_enc    TEXT NOT NULL,       -- AES-256-GCM encrypted, base64 encoded
    nonce           TEXT NOT NULL,       -- GCM nonce, base64 encoded
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (subscriber_id, portal)
);

COMMENT ON TABLE portal_credentials IS 'AES-256-GCM encrypted portal login credentials per subscriber per portal. Master key derived from env; never stored.';
