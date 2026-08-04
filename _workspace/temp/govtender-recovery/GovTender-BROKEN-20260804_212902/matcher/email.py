"""
Digest email sender — delivers daily tender alerts via Resend.
"""
from __future__ import annotations

from api.config import get_settings
from api.debug import log_debug

settings = get_settings()

_FROM_ADDRESS = "tenders@govtender.co.za"
_FROM_NAME = "GovTender Alerts"


def _build_html(digest: dict) -> str:
    sub = digest["subscriber"]
    matches = digest["matches"]
    company = sub.get("company_name", "")
    count = len(matches)

    rows = ""
    for m in matches:
        value = f"R{m['estimated_value']:,.0f}" if m.get("estimated_value") else "Not specified"
        closing = str(m.get("closing_date", ""))[:10] if m.get("closing_date") else "TBC"
        source_url = m.get("source_url") or "#"
        rows += f"""
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">
            <a href="{source_url}" style="color:#1a56db;font-weight:600;">{m['title']}</a><br>
            <small style="color:#6b7280;">{m['issuing_entity']} · Ref: {m['ref_number']}</small>
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">
            <span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:9999px;font-size:13px;">
              {m['score']}%
            </span>
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;color:#374151;">{value}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;color:#374151;">{closing}</td>
        </tr>
        <tr>
          <td colspan="4" style="padding:4px 8px 12px;color:#6b7280;font-size:13px;">
            {m.get('reason', '')}
          </td>
        </tr>
        """

    return f"""
    <html>
    <body style="font-family:Arial,sans-serif;color:#111;max-width:700px;margin:0 auto;padding:20px;">
      <div style="background:#1a56db;padding:20px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">GovTender — Daily Digest</h1>
        <p style="color:#bfdbfe;margin:4px 0 0;">{company}</p>
      </div>
      <div style="background:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;">
        <p>You have <strong>{count} new tender match{"es" if count != 1 else ""}</strong> today.</p>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f3f4f6;text-align:left;">
              <th style="padding:8px;">Tender</th>
              <th style="padding:8px;text-align:center;">Match</th>
              <th style="padding:8px;">Value</th>
              <th style="padding:8px;">Closes</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
        <div style="margin-top:24px;text-align:center;">
          <a href="https://govtender.co.za/dashboard/tenders"
             style="background:#1a56db;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
            View all tenders &rarr;
          </a>
        </div>
      </div>
      <div style="padding:12px;text-align:center;color:#9ca3af;font-size:12px;">
        GovTender · Unsubscribe from digest
      </div>
    </body>
    </html>
    """


async def send_digest_email(digest: dict) -> None:
    """Send the daily digest email for one subscriber."""
    import resend

    resend.api_key = settings.resend_api_key

    sub = digest["subscriber"]
    count = len(digest["matches"])
    subject = f"GovTender: {count} tender match{'es' if count != 1 else ''} today"

    log_debug("EMAIL_SEND", {"to": sub["email"], "count": count})

    resend.Emails.send({
        "from": f"{_FROM_NAME} <{_FROM_ADDRESS}>",
        "to": [sub["email"]],
        "subject": subject,
        "html": _build_html(digest),
    })

    log_debug("EMAIL_SENT", {"to": sub["email"]})
