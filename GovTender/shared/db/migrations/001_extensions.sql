-- 001_extensions.sql
-- Enable required PostgreSQL extensions
-- Run once on a fresh database before any other migrations

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
