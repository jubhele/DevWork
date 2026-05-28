"""
proposal_grader.py — Batch proposal quality grader using the Anthropic SDK.

Usage:
    python proposal_grader.py <path-to-proposal.docx-or-.md> [path2 ...]
    python proposal_grader.py --dir BlackFire/Clients/AECI/

Reads each file, grades it against the BlackFire proposal rubric, and writes a
<filename>_grade_YYYYMMDD.md report alongside the source file.

Requires: ANTHROPIC_API_KEY environment variable.
Install:  pip install anthropic python-docx
"""

import os
import sys
import argparse
from datetime import datetime
from pathlib import Path

import anthropic

# ---------------------------------------------------------------------------
# Rubric (mirrors /proposal-review slash command)
# ---------------------------------------------------------------------------

RUBRIC = """
You are a senior proposals reviewer for BlackFire Solutions, a South African security company.
Grade the following document against these 6 dimensions (score each 1–5):

1. Executive clarity — Can a non-technical exec understand the value proposition in the first 2 paragraphs?
   Is there a clear problem → solution → outcome arc?

2. Technical accuracy — Are system names, product names, and capabilities correctly described?
   Check that claimed SLAs are consistent with the service model described.

3. Commercial completeness — Is pricing broken down (setup + monthly + per-incident)?
   Are SLAs explicit? Are exclusions and assumptions listed?

4. Language & tone — Professional, confident, no passive-voice commitments.
   No "demo"/"pilot"/"trial"/"test" language. South African English spelling.

5. Brand consistency — "BlackFire Solutions" on first use, "BlackFire" thereafter.
   Software platform = "the Umlilo Portal". Never "Blackfire" or "BLACKFIRE".

6. Risk & compliance — POPIA language for personal data, liability cap, insurance cover.

Output ONLY valid JSON in this exact shape:
{
  "document": "<filename>",
  "date": "<YYYY-MM-DD>",
  "scores": {
    "executive_clarity": <1-5>,
    "technical_accuracy": <1-5>,
    "commercial_completeness": <1-5>,
    "language_tone": <1-5>,
    "brand_consistency": <1-5>,
    "risk_compliance": <1-5>
  },
  "total": <sum>,
  "critical_issues": ["<issue>", ...],
  "improvements": ["<suggestion>", ...],
  "verdict": "READY TO SEND | NEEDS REVISION | DO NOT SEND"
}
"""


def read_file(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".docx":
        try:
            from docx import Document
            doc = Document(str(path))
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except ImportError:
            print("python-docx not installed — run: pip install python-docx")
            sys.exit(1)
    elif suffix in (".md", ".txt"):
        return path.read_text(encoding="utf-8")
    else:
        print(f"Unsupported format: {suffix}. Use .docx, .md, or .txt")
        sys.exit(1)


def grade(client: anthropic.Anthropic, path: Path) -> dict:
    content = read_file(path)
    prompt = f"Document filename: {path.name}\n\n---\n\n{content[:40000]}"

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",  # Tier 1 — grading is structured, not creative
        max_tokens=1024,
        system=RUBRIC,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = "\n".join(raw.split("\n")[1:-1])
    return json.loads(raw)


def write_report(result: dict, source_path: Path) -> Path:
    today = datetime.now().strftime("%Y%m%d")
    report_path = source_path.parent / f"{source_path.stem}_grade_{today}.md"

    scores = result["scores"]
    rows = "\n".join(
        f"| {k.replace('_', ' ').title():25} | {v}/5 |"
        for k, v in scores.items()
    )
    critical = "\n".join(f"- {i}" for i in result.get("critical_issues", [])) or "None"
    improvements = "\n".join(f"- {i}" for i in result.get("improvements", [])) or "None"

    report = f"""# Proposal Grade Report
Document: {result['document']}
Date: {result['date']}
Graded by: proposal_grader.py (claude-haiku-4-5)

| Dimension                 | Score |
|---------------------------|-------|
{rows}
| **Total**                 | **{result['total']}/30** |

## Critical Issues (fix before sending)
{critical}

## Recommended Improvements
{improvements}

## Verdict
**{result['verdict']}**
"""
    report_path.write_text(report, encoding="utf-8")
    return report_path


def main():
    parser = argparse.ArgumentParser(description="Grade BlackFire proposals")
    parser.add_argument("files", nargs="*", help="Proposal files to grade")
    parser.add_argument("--dir", help="Grade all .docx/.md files in a directory")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    paths: list[Path] = []
    if args.dir:
        d = Path(args.dir)
        paths = [p for p in d.iterdir() if p.suffix.lower() in (".docx", ".md", ".txt")]
    for f in args.files:
        paths.append(Path(f))

    if not paths:
        print("No files to grade. Pass file paths or --dir.")
        sys.exit(1)

    for path in paths:
        print(f"Grading: {path.name} ...", end=" ", flush=True)
        try:
            result = grade(client, path)
            report = write_report(result, path)
            verdict = result["verdict"]
            total = result["total"]
            print(f"{total}/30 — {verdict} → {report.name}")
        except Exception as e:
            print(f"FAILED — {e}")


if __name__ == "__main__":
    main()
