"""
Proposal Generator — Claude Sonnet 4.6 with RAG context injection.

Generates a complete, submission-ready proposal for a matched tender.
Uses the subscriber's stored documents (via RAG) to populate real company data.
Outputs: in-memory .docx (via python-docx) + PDF path (via WeasyPrint).
"""
from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Any

import anthropic
from docx import Document
from docx.shared import Pt

from api.config import get_settings
from api.debug import log_debug
from proposal.rag import retrieve_context
from proposal.rfq import build_rfq, format_rfq_for_prompt, format_rfq_for_docx

settings = get_settings()

_MODEL = "claude-sonnet-4-6"
_MAX_TOKENS = 4096
_STORAGE_PATH = Path(getattr(settings, "storage_path", "uploads"))


async def generate(
    tender: dict[str, Any],
    subscriber: dict[str, Any],
    proposal_id: str,
) -> dict[str, str]:
    """
    Generate a proposal for the given tender and subscriber.
    Returns {docx_path, pdf_path} relative to STORAGE_PATH.
    """
    subscriber_id = str(subscriber["id"])
    log_debug("PROPOSAL_START", {
        "proposal_id": proposal_id,
        "tender_ref": tender.get("ref_number"),
        "subscriber_id": subscriber_id,
    })

    # Retrieve relevant context from subscriber's stored documents
    query = f"{tender.get('title', '')} {tender.get('description', '')[:200]}"
    context_chunks = await retrieve_context(subscriber_id, query, top_k=6)
    context_text = "\n\n---\n\n".join(c["content_chunk"] for c in context_chunks)

    # Build RFQ pricing schedule (industry-standard items + 40% markup)
    rfq = await build_rfq(tender)

    proposal_text = await _call_sonnet(tender, subscriber, context_text, rfq)

    docx_path = await _render_docx(proposal_text, tender, subscriber, proposal_id, rfq)
    pdf_path = await _render_pdf(docx_path, proposal_id)

    log_debug("PROPOSAL_DONE", {
        "proposal_id": proposal_id,
        "docx_path": docx_path,
        "pdf_path": pdf_path,
    })

    return {"docx_path": docx_path, "pdf_path": pdf_path}


async def _call_sonnet(
    tender: dict[str, Any],
    subscriber: dict[str, Any],
    context_text: str,
    rfq: dict[str, Any] | None = None,
) -> str:
    """Call Claude Sonnet to draft the proposal. Returns the full proposal text."""
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    system_prompt = (
        "You are an expert South African government tender proposal writer. "
        "You write clear, professional, compliance-aware proposals that win government contracts. "
        "Follow all formatting instructions exactly. Use South African English spelling."
    )

    profile_text = (
        f"Company: {subscriber.get('company_name', '')}\n"
        f"CSD Number: {subscriber.get('csd_number', 'TBC')}\n"
        f"B-BBEE Level: {subscriber.get('bbbee_level', 'TBC')}\n"
        f"CIDB Grade: {subscriber.get('cidb_grade', 'N/A')}\n"
        f"Service Lines: {', '.join(subscriber.get('service_lines', []))}\n"
        f"Geographic Reach: {', '.join(subscriber.get('geographic_reach', ['National']))}"
    )

    tender_text = (
        f"Reference: {tender.get('ref_number', '')}\n"
        f"Title: {tender.get('title', '')}\n"
        f"Issuing Entity: {tender.get('issuing_entity', '')}\n"
        f"Closing Date: {tender.get('closing_date', 'TBC')}\n"
        f"Estimated Value: R{tender.get('estimated_value') or 'Not specified'}\n"
        f"B-BBEE Required: Level {tender.get('bbbee_level') or 'Not specified'}\n"
        f"CIDB Grade Required: {tender.get('cidb_grade') or 'Not specified'}\n"
        f"Description:\n{(tender.get('description') or '')[:1000]}"
    )

    rfq_table = format_rfq_for_prompt(rfq) if rfq else (
        "| Item | Description | Unit | Qty | Rate (R) | Total (R) |\n"
        "|------|-------------|------|-----|----------|----------|\n"
        "| [Itemise costs based on scope of work] | | | | | |"
    )

    user_prompt = f"""
Write a complete, professional South African government tender proposal using these inputs.

## COMPANY PROFILE
{profile_text}

## TENDER DETAILS
{tender_text}

## RELEVANT COMPANY DOCUMENTS (for reference)
{context_text or 'No documents uploaded yet.'}

## REQUIRED PROPOSAL STRUCTURE
Write the proposal with these sections in order. Use "## SECTION NAME" headings.

## COVER LETTER
Address to the Supply Chain Manager of the issuing entity. Reference the tender number.
Express intent to submit, summarise capability, and confirm compliance.

## COMPANY OVERVIEW
Who we are, what we do, why we are qualified for this tender.

## TECHNICAL APPROACH / METHOD STATEMENT
How we will deliver the scope of work. Specific, measurable, achievable.

## TEAM AND QUALIFICATIONS
Key personnel, their roles, relevant qualifications and certifications.

## RELEVANT EXPERIENCE
Previous similar work completed. Mention client, scope, value, and outcome.

## RFQ / PRICING SCHEDULE
Use EXACTLY the pre-built pricing table below. Do NOT change any values. Copy it verbatim.
Add a brief paragraph above the table explaining your pricing approach (1-2 sentences).

{rfq_table}

## COMPLIANCE CHECKLIST
List required documents and indicate which are enclosed:
- Tax Clearance Certificate
- CSD Registration Confirmation
- B-BBEE Certificate
- Company Registration
- Any tender-specific requirements

## DECLARATION
Company name, authorised signatory line, date field.

---
Write in professional South African English. Be specific and confident. Do not use filler phrases.
"""

    log_debug("API_CALL", {"model": _MODEL, "action": "generate_proposal"})

    response = await client.messages.create(
        model=_MODEL,
        max_tokens=_MAX_TOKENS,
        system=[{"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": user_prompt}],
    )

    log_debug("API_RESPONSE", {
        "model": _MODEL,
        "tokens_in": response.usage.input_tokens,
        "tokens_out": response.usage.output_tokens,
    })

    return response.content[0].text


async def _render_docx(
    proposal_text: str,
    tender: dict[str, Any],
    subscriber: dict[str, Any],
    proposal_id: str,
    rfq: dict[str, Any] | None = None,
) -> str:
    """Render proposal text to a .docx file. Returns relative path."""
    doc = Document()

    # Title block
    title = doc.add_heading(f"TENDER PROPOSAL", 0)
    doc.add_paragraph(f"Tender Reference: {tender.get('ref_number', '')}")
    doc.add_paragraph(f"Prepared by: {subscriber.get('company_name', '')}")
    doc.add_paragraph(f"Date: {datetime.now().strftime('%d %B %Y')}")
    doc.add_paragraph("")

    _in_rfq_section = False

    # Parse sections
    for line in proposal_text.split("\n"):
        stripped = line.strip()
        if stripped.startswith("## "):
            heading_text = stripped[3:]
            doc.add_heading(heading_text, level=1)
            if rfq and not _in_rfq_section and "RFQ" in heading_text.upper():
                # Emit the structured RFQ table immediately after its heading
                _insert_rfq_table(doc, rfq)
                _in_rfq_section = True
            else:
                # Leaving the RFQ section
                _in_rfq_section = False
        elif stripped.startswith("### "):
            doc.add_heading(stripped[4:], level=2)
        elif stripped.startswith("| "):
            if _in_rfq_section:
                # Skip markdown table rows — already rendered via _insert_rfq_table
                pass
            else:
                cells = [c.strip() for c in stripped.split("|") if c.strip()]
                if cells:
                    table = doc.add_table(rows=1, cols=len(cells))
                    table.style = "Table Grid"
                    for i, cell in enumerate(cells):
                        table.rows[0].cells[i].text = cell
        elif stripped:
            if not _in_rfq_section:
                doc.add_paragraph(stripped)

    output_dir = _STORAGE_PATH / "proposals" / proposal_id
    output_dir.mkdir(parents=True, exist_ok=True)
    docx_path = output_dir / "proposal.docx"
    doc.save(str(docx_path))

    return str(docx_path)


def _insert_rfq_table(doc: Document, rfq: dict[str, Any]) -> None:
    """Insert a fully formatted RFQ table into the docx document."""
    from docx.shared import Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    headers = ["Item", "Description", "Unit", "Qty", "Market Rate (R)", "Our Rate (R)", "Total (R)"]
    rfq_rows = format_rfq_for_docx(rfq)

    table = doc.add_table(rows=1 + len(rfq_rows) + 1, cols=len(headers))
    table.style = "Table Grid"

    # Header row
    hdr = table.rows[0]
    for i, h in enumerate(headers):
        cell = hdr.cells[i]
        cell.text = h
        run = cell.paragraphs[0].runs[0]
        run.bold = True

    # Data rows
    for r_idx, row in enumerate(rfq_rows, start=1):
        vals = [
            row["item"], row["description"], row["unit"],
            row["qty"], row["rate"], row["our_rate"], row["total"],
        ]
        for c_idx, val in enumerate(vals):
            table.rows[r_idx].cells[c_idx].text = val

    # Totals row
    total_row = table.rows[-1]
    total_row.cells[0].text = "TOTAL"
    total_row.cells[0].paragraphs[0].runs[0].bold = True
    total_row.cells[-1].text = f"R {rfq['grand_total_zar']:,.2f}"
    total_row.cells[-1].paragraphs[0].runs[0].bold = True

    # Markup note
    doc.add_paragraph(
        f"Pricing includes a {rfq['markup_pct']}% uplift on market rates, covering overhead, "
        "contingency, and profit margin — in line with National Treasury SCM guidelines."
    )
    if rfq.get("notes"):
        note_para = doc.add_paragraph(f"Note: {rfq['notes']}")
        note_para.runs[0].italic = True


async def _render_pdf(docx_path: str, proposal_id: str) -> str:
    """Convert the docx to PDF via WeasyPrint (HTML intermediary). Returns pdf path."""
    import subprocess

    pdf_path = str(Path(docx_path).with_suffix(".pdf"))

    # Use LibreOffice headless if available (most reliable docx→pdf on Linux/server)
    try:
        result = subprocess.run(
            ["libreoffice", "--headless", "--convert-to", "pdf", "--outdir",
             str(Path(docx_path).parent), docx_path],
            capture_output=True, timeout=30,
        )
        if result.returncode == 0:
            log_debug("PDF_RENDER", {"method": "libreoffice", "path": pdf_path})
            return pdf_path
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    # WeasyPrint fallback: convert docx text to simple HTML then to PDF
    try:
        from weasyprint import HTML
        from docx import Document as DocxDocument

        doc = DocxDocument(docx_path)
        html_lines = ["<html><body style='font-family:Arial;margin:2cm;'>"]
        for para in doc.paragraphs:
            if para.style.name.startswith("Heading"):
                level = para.style.name[-1]
                html_lines.append(f"<h{level}>{para.text}</h{level}>")
            elif para.text.strip():
                html_lines.append(f"<p>{para.text}</p>")
        html_lines.append("</body></html>")

        HTML(string="\n".join(html_lines)).write_pdf(pdf_path)
        log_debug("PDF_RENDER", {"method": "weasyprint", "path": pdf_path})
    except Exception as exc:
        log_debug("PDF_RENDER_ERROR", {"error": str(exc)})
        pdf_path = ""

    return pdf_path
