"""
token_tracker.py — Analyse session logs to track cost and model usage patterns.

Usage:
    python token_tracker.py                              # Summarise all sessions this month
    python token_tracker.py --days 7                     # Last 7 days
    python token_tracker.py --session <file>             # Single session file
    python token_tracker.py --report                     # Full CSV export to temp/token_report.csv
    python token_tracker.py --sessions-dir ./sessions    # Use a custom sessions directory

Reads session log .md files from c:\DevWork\sessions\ (or --sessions-dir) and extracts:
- Model used
- Task tier
- Files changed count
- Estimated token usage (heuristic: ~600 tokens/KB of session log)
- Estimated cost

Output: a summary table printed to stdout, plus optional CSV.
"""

import os
import re
import csv
import argparse
from datetime import datetime, timedelta
from pathlib import Path

_DEFAULT_SESSIONS_DIR = Path(r"c:\DevWork\sessions")
TEMP_DIR = Path(r"c:\DevWork\temp")

# Rough pricing (USD per million tokens, as of 2026-05)
MODEL_PRICING = {
    "claude-haiku-4-5":    {"input": 0.80,  "output": 4.00},
    "claude-sonnet-4-6":   {"input": 3.00,  "output": 15.00},
    "claude-opus-4-7":     {"input": 15.00, "output": 75.00},
    "gpt-4o-mini":         {"input": 0.15,  "output": 0.60},
    "gpt-4o":              {"input": 5.00,  "output": 15.00},
    "gemini-flash-2.0":    {"input": 0.075, "output": 0.30},
    "gemini-1.5-pro":      {"input": 3.50,  "output": 10.50},
    "default":             {"input": 3.00,  "output": 15.00},
}

TIER_COST_TARGETS = {1: 0.05, 2: 0.50, 3: 5.00}


def parse_session(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="ignore")

    # Extract fields via regex
    model_match = re.search(r"Model:\s*(.+)", text)
    tier_match  = re.search(r"Task tier:\s*([\d])", text)
    date_match  = re.search(r"Date:\s*(\d{4}-\d{2}-\d{2})", text)
    files_done  = len(re.findall(r"^- .+\.(php|js|css|py|sql|ps1|md)", text, re.MULTILINE))

    model = model_match.group(1).strip().lower() if model_match else "unknown"
    tier  = int(tier_match.group(1)) if tier_match else 2
    date  = date_match.group(1) if date_match else path.stem[-8:]

    # Heuristic token estimate: session log KB * 600 tokens/KB
    kb = path.stat().st_size / 1024
    est_tokens = int(kb * 600)
    input_tokens  = int(est_tokens * 0.7)
    output_tokens = int(est_tokens * 0.3)

    # Find pricing key
    pricing_key = "default"
    for key in MODEL_PRICING:
        if key in model:
            pricing_key = key
            break

    pricing = MODEL_PRICING[pricing_key]
    est_cost = (input_tokens * pricing["input"] + output_tokens * pricing["output"]) / 1_000_000

    target = TIER_COST_TARGETS.get(tier, 0.50)
    over_budget = est_cost > target

    return {
        "file":         path.name,
        "date":         date,
        "model":        model,
        "tier":         tier,
        "files_changed": files_done,
        "est_tokens":   est_tokens,
        "est_cost_usd": round(est_cost, 4),
        "target_usd":   target,
        "over_budget":  over_budget,
    }


def summarise(sessions: list[dict]) -> None:
    if not sessions:
        print("No session logs found.")
        return

    total_cost  = sum(s["est_cost_usd"] for s in sessions)
    total_tokens = sum(s["est_tokens"] for s in sessions)
    over_count  = sum(1 for s in sessions if s["over_budget"])

    print(f"\n{'─'*90}")
    print(f"{'File':<45} {'Date':<12} {'Model':<22} {'T'} {'Est $':>7} {'Target':>7} {'!'}")
    print(f"{'─'*90}")

    for s in sorted(sessions, key=lambda x: x["date"], reverse=True):
        flag = "⚠" if s["over_budget"] else " "
        model_short = s["model"][:22]
        print(
            f"{s['file'][:44]:<45} {s['date']:<12} {model_short:<22} "
            f"{s['tier']} ${s['est_cost_usd']:>6.4f} ${s['target_usd']:>6.2f} {flag}"
        )

    print(f"{'─'*90}")
    print(f"Sessions: {len(sessions):>3}  |  Total tokens: ~{total_tokens:,}  |  Total est. cost: ${total_cost:.4f}")
    if over_count:
        print(f"\n⚠  {over_count} session(s) estimated over budget. Consider downgrading model tier.")

    # Model usage breakdown
    from collections import Counter
    model_counts = Counter(s["model"] for s in sessions)
    print("\nModel usage:")
    for model, count in model_counts.most_common():
        print(f"  {model:<30} {count:>3} session(s)")


def export_csv(sessions: list[dict], out_path: Path) -> None:
    TEMP_DIR.mkdir(exist_ok=True)
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=sessions[0].keys())
        writer.writeheader()
        writer.writerows(sessions)
    print(f"\nCSV exported to: {out_path}")


def main():
    parser = argparse.ArgumentParser(description="Analyse session log token usage")
    parser.add_argument("--days",         type=int, default=30,  help="Look back N days (default 30)")
    parser.add_argument("--session",                              help="Analyse a single session file")
    parser.add_argument("--sessions-dir", default=None,          help="Path to sessions directory (default: c:\\DevWork\\sessions)")
    parser.add_argument("--report",       action="store_true",   help="Export CSV to temp/")
    args = parser.parse_args()

    sessions_dir = Path(args.sessions_dir) if args.sessions_dir else _DEFAULT_SESSIONS_DIR

    if args.session:
        path = Path(args.session)
        if not path.exists():
            path = sessions_dir / args.session
        sessions = [parse_session(path)]
    else:
        cutoff = datetime.now() - timedelta(days=args.days)
        sessions = []
        for p in sessions_dir.glob("*.md"):
            try:
                mtime = datetime.fromtimestamp(p.stat().st_mtime)
                if mtime >= cutoff:
                    sessions.append(parse_session(p))
            except Exception:
                continue

    summarise(sessions)

    if args.report and sessions:
        export_csv(sessions, TEMP_DIR / f"token_report_{datetime.now().strftime('%Y%m%d')}.csv")


if __name__ == "__main__":
    main()
