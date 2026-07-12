# GovTender — System Technical Test Manual (STTM)

*Maintained by uMbhali. Test cases added by uMvavanyi on each production delivery.*

---

## QA Principles

1. Pattern 21 debug hook verified present before any functional test begins
2. Golden path AND edge cases — happy-path-only is a failed QA pass
3. Auth tested at every endpoint: unauthenticated → 401, wrong tier → 403
4. Severity ratings are mandatory: CRITICAL (blocks release) | HIGH | MEDIUM | LOW

---

## T001 — Crawler: eTenders

| Test | Expected | Severity if fail |
|------|----------|-----------------|
| `crawl_etenders()` returns > 0 tenders | tender_count > 0 | CRITICAL |
| No duplicate `ref_number` in DB after crawl | `SELECT COUNT(*) FROM tenders WHERE source_portal='etenders'` equals unique ref_numbers | HIGH |
| All required fields populated | `title`, `issuing_entity`, `closing_date` not NULL | HIGH |
| Pattern 21 log entry for CRAWL_START + CRAWL_END | `sessions/debug_*.log` contains both events | MEDIUM |

---

## T002 — Matcher: Claude Haiku Scorer

| Test | Expected | Severity if fail |
|------|----------|-----------------|
| Score is integer 0-100 | `isinstance(score, int) and 0 <= score <= 100` | CRITICAL |
| Reason is non-empty string | `len(reason) > 10` | HIGH |
| Astute Insights profile matches BI/data tenders (score >= 60) | Score >= 60 on 3 sample data engineering tenders | HIGH |
| BlackFire profile matches security tenders (score >= 60) | Score >= 60 on 3 sample guarding tenders | HIGH |
| Unrelated tender scores < 40 | Score < 40 on 2 clearly irrelevant tenders | MEDIUM |

---

## T003 — Proposal Generator

| Test | Expected | Severity if fail |
|------|----------|-----------------|
| `.docx` file created at `docx_path` | File exists with size > 10KB | CRITICAL |
| `.pdf` file created at `pdf_path` | File exists with size > 5KB | CRITICAL |
| All required sections present in .docx | Cover letter, capability statement, method statement, pricing schedule, B-BBEE declaration | HIGH |
| RAG retrieval returns chunks from correct subscriber | Chunks belong to requesting subscriber_id only | HIGH |
| Pattern 21 log entry for API_CALL with token counts | Debug log shows `tokens_in` and `tokens_out` | MEDIUM |

---

## T004 — Credential Vault

| Test | Expected | Severity if fail |
|------|----------|-----------------|
| Encrypted ciphertext differs from plaintext | `ciphertext != username and ciphertext != password` | CRITICAL |
| Decrypt with correct tenant key returns original values | `decrypt(encrypt(x)) == x` | CRITICAL |
| Decrypt with wrong tenant key raises exception | `VaultDecryptionError` raised | CRITICAL |
| VAULT_MASTER_SECRET never appears in any log or response | Grep `sessions/debug_*.log` for master secret value | CRITICAL |

---

## T005 — API Auth

| Test | Expected | Severity if fail |
|------|----------|-----------------|
| `GET /tenders` without token | HTTP 401 | HIGH |
| `POST /proposals/generate` with Scout tier token | HTTP 403 (Scout cannot generate) | HIGH |
| `GET /tenders` with valid Respond tier token | HTTP 200 + tenders array | HIGH |
| Expired JWT | HTTP 401 | HIGH |

---

## T006 — Form Automation (eTenders)

| Test | Expected | Severity if fail |
|------|----------|-----------------|
| Login with valid subscriber credentials succeeds | Playwright session authenticated | CRITICAL |
| All mandatory form fields filled | No "required field" validation errors on submission | HIGH |
| Documents attached | Portal shows attached files | HIGH |
| Confirmation reference number captured | `proposal.submission_ref` populated | HIGH |
| Invalid portal credentials → graceful error | `PortalAuthError` raised; not silent failure | HIGH |

---

## T007 — Regression Checklist (run after any change)

- [ ] `/health` returns `{"status": "ok"}`
- [ ] Crawler runs without exception on at least one portal
- [ ] Matcher produces scores for at least one (tender, subscriber) pair
- [ ] Proposal generation completes without exception
- [ ] Auth endpoints (login, JWT verify) work for all active subscriber accounts
- [ ] Stripe webhook endpoint accepts a test event without error
