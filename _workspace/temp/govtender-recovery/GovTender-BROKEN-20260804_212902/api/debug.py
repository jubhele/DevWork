"""
Pattern 21 — Standardized Debug Hook

Every module in GovTender imports and uses log_debug() to log critical state transitions.
Activates only when DEBUG_MODE=true in .env. Silent in production.

Usage:
    from api.debug import log_debug

    log_debug('CRAWL_START', {'portal': 'etenders', 'page': 1})
    log_debug('DB_WRITE', {'table': 'tenders', 'ref': ref_number, 'id': str(new_id)})
    log_debug('API_CALL', {'model': 'claude-haiku-4-5', 'tokens_in': n, 'tokens_out': m})
    log_debug('VAULT_DECRYPT', {'portal': portal, 'subscriber_id': str(sid)})
    log_debug('SUBMIT_COMPLETE', {'portal': 'etenders', 'ref': submission_ref})
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path


def log_debug(event: str, context: dict | None = None) -> None:
    """Write a structured debug log entry if DEBUG_MODE is enabled."""
    if os.getenv("DEBUG_MODE", "false").lower() != "true":
        return

    task_id = os.getenv("TASK_ID", "default")
    log_dir = Path(os.getenv("AGENT_SESSION_LOG_PATH", "sessions"))
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / f"debug_{task_id}.log"

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    entry = f"[{timestamp}] {event}: {json.dumps(context or {})}\n"

    with open(log_path, "a", encoding="utf-8") as f:
        f.write(entry)
