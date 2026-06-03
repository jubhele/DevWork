-- Migration: add legal_name to bf_clients + update AECI Chempark with correct PO details
-- Source documents: Order CP1590 (AECI Property Services / Chemhold Investments Pty Ltd)
-- Safe to run multiple times.

SET NAMES utf8mb4;

-- ── Add legal_name column ─────────────────────────────────────────────────────
-- Stores the registered legal entity name separately from the trading/site name.
ALTER TABLE bf_clients
  ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255) NOT NULL DEFAULT ''
    COMMENT 'Registered legal entity name — may differ from trading name stored in `name`';

-- ── Update AECI Chempark with verified details from PO CP1590 ─────────────────
-- PO issued by: Chemhold Investments Pty Ltd (C/O Chempark — Site Recovery)
-- Our contact:  quotes.modderfontein@aeciworld.com
-- Their address: 200 Bergrivier Drive, Chloorkop Ext. 24, Kempton Park 1619
-- VAT: 4200104349 | Tel: (011) 457-1700
UPDATE bf_clients
SET
  legal_name     = 'Chemhold Investments Pty Ltd',
  email          = 'quotes.modderfontein@aeciworld.com',
  phone          = '(011) 457-1700',
  vat_number     = '4200104349',
  address        = '200 Bergrivier Drive, Chloorkop Ext. 24, Kempton Park 1619',
  contact_person = 'quotes.modderfontein@aeciworld.com',
  notes          = 'C/O Chempark — Site Recovery. Primary client. AECI Group chemical park. Legal entity: Chemhold Investments Pty Ltd.'
WHERE name = 'AECI Chempark'
LIMIT 1;
