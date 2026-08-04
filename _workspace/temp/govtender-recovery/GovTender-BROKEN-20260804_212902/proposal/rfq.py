"""
RFQ (Request for Quote) pricing module.

Identifies industry-standard line items for a given tender category,
prices them at current South African market rates, and applies a 40%
markup (covering overhead, contingency, and profit margin — standard
practice for government RFQ submissions).
"""
from __future__ import annotations

import json
from typing import Any

import anthropic

from api.config import get_settings
from api.debug import log_debug

settings = get_settings()

_MODEL = "claude-sonnet-4-6"
_MARKUP_RATE = 0.40


async def build_rfq(tender: dict[str, Any]) -> dict[str, Any]:
    """
    Generate a complete RFQ pricing schedule for the given tender.

    Returns:
        {
            "items": [
                {
                    "item": str,
                    "description": str,
                    "unit": str,
                    "qty": int | float,
                    "rate_zar": float,          # market rate before markup
                    "marked_up_rate_zar": float, # rate + 40%
                    "total_zar": float,           # marked_up_rate × qty
                }
            ],
            "subtotal_zar": float,
            "markup_pct": int,   # always 40
            "grand_total_zar": float,
            "notes": str,
        }
    """
    log_debug("RFQ_START", {
        "tender_ref": tender.get("ref_number"),
        "title": tender.get("title"),
    })

    raw = await _call_claude(tender)
    rfq = _parse_and_apply_markup(raw)

    log_debug("RFQ_DONE", {
        "tender_ref": tender.get("ref_number"),
        "item_count": len(rfq["items"]),
        "grand_total_zar": rfq["grand_total_zar"],
    })

    return rfq


async def _call_claude(tender: dict[str, Any]) -> list[dict[str, Any]]:
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    tender_summary = (
        f"Title: {tender.get('title', '')}\n"
        f"Category: {tender.get('category', 'General')}\n"
        f"Issuing Entity: {tender.get('issuing_entity', '')}\n"
        f"Estimated Value: R{tender.get('estimated_value') or 'Not specified'}\n"
        f"Description: {(tender.get('description') or '')[:600]}"
    )

    prompt = f"""You are an expert South African government procurement consultant.

A supplier is responding to this tender and must include a Request for Quote (RFQ) pricing schedule:

{tender_summary}

Task:
1. Identify the industry-standard line items that a government buyer would expect in an RFQ for this
   type of tender. Use real procurement taxonomy (e.g. CIDB, NT SCM frameworks, ISO/SANS standards).
2. Assign realistic South African market rates in ZAR (2025–2026 market).
3. Assign appropriate quantities and units.

Return ONLY valid JSON — no markdown, no commentary — matching this exact schema:
{{
  "items": [
    {{
      "item": "short item name",
      "description": "detailed description of what this covers",
      "unit": "unit of measure (e.g. each, m², hour, lot, month)",
      "qty": <number>,
      "rate_zar": <number — market rate before any markup>
    }}
  ],
  "notes": "any important pricing assumptions or market notes (1-2 sentences)"
}}

Include 6–15 items. Be specific to the tender category. Use realistic ZAR market rates."""

    log_debug("API_CALL", {"model": _MODEL, "action": "rfq_line_items"})

    response = await client.messages.create(
        model=_MODEL,
        max_tokens=2048,
        system=[{
            "type": "text",
            "text": (
                "You are a South African government procurement expert. "
                "Output only valid JSON when asked. No markdown fences."
            ),
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[{"role": "user", "content": prompt}],
    )

    log_debug("API_RESPONSE", {
        "model": _MODEL,
        "tokens_in": response.usage.input_tokens,
        "tokens_out": response.usage.output_tokens,
        "action": "rfq_line_items",
    })

    raw_text = response.content[0].text.strip()

    # Strip markdown code fences if Claude added them despite instructions
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]

    return json.loads(raw_text)


def _parse_and_apply_markup(raw: dict[str, Any]) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    subtotal = 0.0

    for row in raw.get("items", []):
        rate = float(row.get("rate_zar", 0))
        qty = float(row.get("qty", 1))
        marked_up = round(rate * (1 + _MARKUP_RATE), 2)
        total = round(marked_up * qty, 2)
        subtotal += total

        items.append({
            "item": row.get("item", ""),
            "description": row.get("description", ""),
            "unit": row.get("unit", "each"),
            "qty": qty,
            "rate_zar": round(rate, 2),
            "marked_up_rate_zar": marked_up,
            "total_zar": total,
        })

    grand_total = round(subtotal, 2)

    return {
        "items": items,
        "subtotal_zar": grand_total,
        "markup_pct": int(_MARKUP_RATE * 100),
        "grand_total_zar": grand_total,
        "notes": raw.get("notes", ""),
    }


def format_rfq_for_prompt(rfq: dict[str, Any]) -> str:
    """
    Render the RFQ as plain-text table rows suitable for injection into
    the Claude proposal prompt (section: RFQ / PRICING SCHEDULE).
    """
    lines = [
        "| Item | Description | Unit | Qty | Market Rate (R) | Our Rate (R) | Total (R) |",
        "|------|-------------|------|-----|-----------------|--------------|-----------|",
    ]
    for row in rfq["items"]:
        lines.append(
            f"| {row['item']} "
            f"| {row['description']} "
            f"| {row['unit']} "
            f"| {row['qty']:g} "
            f"| {row['rate_zar']:,.2f} "
            f"| {row['marked_up_rate_zar']:,.2f} "
            f"| {row['total_zar']:,.2f} |"
        )

    lines.append(f"| **TOTAL** | | | | | | **R {rfq['grand_total_zar']:,.2f}** |")
    lines.append("")
    lines.append(
        f"_Pricing includes a {rfq['markup_pct']}% uplift on market rates, "
        "covering overhead, contingency, and profit margin — in line with National Treasury "
        "SCM guidelines for government RFQ submissions._"
    )
    if rfq.get("notes"):
        lines.append(f"_Note: {rfq['notes']}_")

    return "\n".join(lines)


def format_rfq_for_docx(rfq: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Return structured rows ready for _render_docx table rendering.
    Each dict has keys: item, description, unit, qty, rate, our_rate, total.
    """
    rows = []
    for row in rfq["items"]:
        rows.append({
            "item": row["item"],
            "description": row["description"],
            "unit": row["unit"],
            "qty": f"{row['qty']:g}",
            "rate": f"R {row['rate_zar']:,.2f}",
            "our_rate": f"R {row['marked_up_rate_zar']:,.2f}",
            "total": f"R {row['total_zar']:,.2f}",
        })
    return rows
