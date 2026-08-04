"""
Proposal file storage abstraction.
MVP: local filesystem under uploads/.
Production upgrade: swap to S3-compatible (Hetzner Object Storage) by changing _backend.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from api.config import get_settings
from api.debug import log_debug

settings = get_settings()

_BASE = Path(settings.storage_path)


def proposal_dir(proposal_id: str) -> Path:
    d = _BASE / "proposals" / proposal_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_proposal_files(
    proposal_id: str,
    docx_src: str,
    pdf_src: str,
) -> tuple[str, str]:
    """
    Copy generated docx + pdf into the proposal store.
    Returns (docx_path, pdf_path) as stored paths.
    """
    dest = proposal_dir(proposal_id)
    docx_dest = str(dest / "proposal.docx")
    pdf_dest = str(dest / "proposal.pdf")

    if docx_src and Path(docx_src).exists():
        shutil.copy2(docx_src, docx_dest)
    else:
        docx_dest = ""

    if pdf_src and Path(pdf_src).exists():
        shutil.copy2(pdf_src, pdf_dest)
    else:
        pdf_dest = ""

    log_debug("STORAGE_SAVE", {
        "proposal_id": proposal_id,
        "docx": docx_dest,
        "pdf": pdf_dest,
    })
    return docx_dest, pdf_dest


def proposal_download_urls(proposal_id: str) -> dict[str, str | None]:
    """Return signed-URL-style paths for the web frontend. Local: direct file paths."""
    dest = proposal_dir(proposal_id)
    docx = dest / "proposal.docx"
    pdf = dest / "proposal.pdf"
    return {
        "docx_url": f"/proposals/{proposal_id}/download/docx" if docx.exists() else None,
        "pdf_url": f"/proposals/{proposal_id}/download/pdf" if pdf.exists() else None,
    }


def get_proposal_file(proposal_id: str, fmt: str) -> Path | None:
    """Return the Path for a proposal file, or None if not found."""
    dest = proposal_dir(proposal_id)
    path = dest / f"proposal.{fmt}"
    return path if path.exists() else None


def delete_proposal_files(proposal_id: str) -> None:
    dest = proposal_dir(proposal_id)
    if dest.exists():
        shutil.rmtree(dest)
    log_debug("STORAGE_DELETE", {"proposal_id": proposal_id})
