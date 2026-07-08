#!/usr/bin/env python3
"""
Token tracker for BlackFire session logs.
Analyzes session files and estimates token usage and costs.
"""

import os
import sys
import argparse
from datetime import datetime, timedelta
from pathlib import Path
import re

# Token-to-cost mapping (example rates, adjust as needed)
TOKENS_PER_KB = 600
COST_PER_1M_TOKENS = 0.80  # Approximate for input tokens

def parse_session_filename(filename):
    """Extract date from session filename format: blackfire_<topic>_YYYYMMDD_HHmmss.md"""
    # Match pattern: anything_YYYYMMDD_HHmmss.md
    match = re.search(r'_(\d{8})_(\d{6})\.md$', filename)
    if match:
        date_str = match.group(1)
        time_str = match.group(2)
        try:
            return datetime.strptime(f"{date_str}_{time_str}", "%Y%m%d_%H%M%S")
        except ValueError:
            return None
    return None

def get_file_size_kb(filepath):
    """Get file size in KB"""
    try:
        return os.path.getsize(filepath) / 1024
    except (OSError, IOError):
        return 0

def estimate_tokens(size_kb):
    """Estimate tokens from file size"""
    return int(size_kb * TOKENS_PER_KB)

def calculate_cost(tokens):
    """Calculate cost from token count"""
    return (tokens / 1_000_000) * COST_PER_1M_TOKENS

def is_over_budget(tokens, budget_tokens=100_000):
    """Check if session exceeds budget (100k tokens default)"""
    return tokens > budget_tokens

def main():
    parser = argparse.ArgumentParser(description="Track token usage and costs from session logs")
    parser.add_argument("--days", type=int, default=7, help="Number of days to analyze")
    parser.add_argument("--sessions-dir", type=str, default="./sessions", help="Path to sessions directory")

    args = parser.parse_args()

    sessions_dir = Path(args.sessions_dir)
    if not sessions_dir.exists():
        print("No sessions found in last 7 days.")
        return

    # Get cutoff date
    now = datetime.now()
    cutoff_date = now - timedelta(days=args.days)

    # Collect session data
    sessions = []
    for md_file in sorted(sessions_dir.glob("*.md")):
        filename = md_file.name
        # Skip template files
        if filename.startswith("_") or "token_digest" in filename:
            continue

        session_date = parse_session_filename(filename)
        if not session_date or session_date < cutoff_date:
            continue

        size_kb = get_file_size_kb(md_file)
        tokens = estimate_tokens(size_kb)
        cost = calculate_cost(tokens)
        over_budget = is_over_budget(tokens)

        sessions.append({
            'filename': filename,
            'date': session_date,
            'size_kb': size_kb,
            'tokens': tokens,
            'cost': cost,
            'over_budget': over_budget,
        })

    if not sessions:
        print("No sessions found in last 7 days.")
        return

    # Sort by date
    sessions.sort(key=lambda x: x['date'])

    # Generate output
    total_tokens = sum(s['tokens'] for s in sessions)
    total_cost = sum(s['cost'] for s in sessions)
    over_budget_count = sum(1 for s in sessions if s['over_budget'])

    print(f"### Token & Cost Analysis ({args.days} days)")
    print()
    print("| Session | Date | Size (KB) | Tokens | Cost | Budget |")
    print("|---------|------|-----------|--------|------|--------|")

    for session in sessions:
        budget_icon = "⚠" if session['over_budget'] else "✓"
        date_str = session['date'].strftime("%Y-%m-%d %H:%M")
        print(f"| {session['filename'][:40]} | {date_str} | {session['size_kb']:.1f} | {session['tokens']:,} | ${session['cost']:.2f} | {budget_icon} |")

    print()
    print(f"**Summary:**")
    print(f"- Total Sessions: {len(sessions)}")
    print(f"- Total Tokens: {total_tokens:,}")
    print(f"- Total Cost: ${total_cost:.2f}")
    print(f"- Over Budget: {over_budget_count}")

if __name__ == "__main__":
    main()
