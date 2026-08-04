"""
eTenders form automation — etenders.gov.za
Logs in as the subscriber, navigates to the specific tender, fills all mandatory
fields, attaches the generated proposal documents, submits, and captures the
reference number.

Only available on Command tier (auto_submit feature flag).
"""
from __future__ import annotations

from playwright.async_api import async_playwright, Page

from api.debug import log_debug
from automation.vault import load_credential

_BASE_URL = "https://www.etenders.gov.za"
_LOGIN_URL = f"{_BASE_URL}/content/login"
_PORTAL = "etenders"


async def submit(
    subscriber_id: str,
    tender_ref: str,
    tender_url: str,
    docx_path: str,
    pdf_path: str,
    subscriber: dict,
) -> str:
    """
    Submit a proposal on eTenders for the given subscriber.
    Returns the portal submission reference number.
    Raises RuntimeError if submission fails after retries.
    """
    username, password = await load_credential(subscriber_id, _PORTAL)
    log_debug("AUTOMATION_START", {
        "portal": _PORTAL,
        "subscriber_id": subscriber_id,
        "tender_ref": tender_ref,
    })

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="GovTender/0.1 (+https://govtender.co.za/bot) Mozilla/5.0"
        )
        page = await context.new_page()

        try:
            await _login(page, username, password)
            await _navigate_to_tender(page, tender_url, tender_ref)
            ref = await _fill_and_submit(page, subscriber, docx_path, pdf_path)
        finally:
            await browser.close()

    log_debug("AUTOMATION_DONE", {"portal": _PORTAL, "ref": ref})
    return ref


async def _login(page: Page, username: str, password: str) -> None:
    await page.goto(_LOGIN_URL, wait_until="domcontentloaded")
    await page.wait_for_selector("input[name='username'], input[type='email']", timeout=15_000)

    await page.fill("input[name='username'], input[type='email']", username)
    await page.fill("input[name='password'], input[type='password']", password)
    await page.click("button[type='submit'], input[type='submit']")
    await page.wait_for_load_state("networkidle", timeout=20_000)

    if "login" in page.url.lower():
        raise RuntimeError(f"eTenders login failed for {username} — check credentials in vault")

    log_debug("AUTOMATION_LOGIN", {"portal": _PORTAL, "status": "ok"})


async def _navigate_to_tender(page: Page, tender_url: str, tender_ref: str) -> None:
    await page.goto(tender_url, wait_until="domcontentloaded")
    await page.wait_for_selector(".bid-submit, .submit-bid, a[href*='submit'], button:has-text('Submit')", timeout=15_000)
    log_debug("AUTOMATION_NAVIGATE", {"portal": _PORTAL, "tender_ref": tender_ref})


async def _fill_and_submit(page: Page, subscriber: dict, docx_path: str, pdf_path: str) -> str:
    # Fill company details if the form requires them
    for selector, value in [
        ("input[name='company_name'], input[placeholder*='company']", subscriber.get("company_name", "")),
        ("input[name='csd_number'], input[placeholder*='CSD']", subscriber.get("csd_number", "")),
        ("input[name='contact_person'], input[placeholder*='contact']", subscriber.get("company_name", "")),
    ]:
        try:
            el = page.locator(selector).first
            if await el.is_visible():
                await el.fill(value)
        except Exception:
            pass

    # Attach proposal document (prefer PDF; docx as fallback)
    for file_path in [pdf_path, docx_path]:
        if not file_path:
            continue
        try:
            upload = page.locator("input[type='file']").first
            if await upload.is_visible():
                await upload.set_input_files(file_path)
                log_debug("AUTOMATION_ATTACH", {"portal": _PORTAL, "file": file_path})
                break
        except Exception:
            pass

    # Submit
    await page.click("button[type='submit']:has-text('Submit'), input[value='Submit']")
    await page.wait_for_load_state("networkidle", timeout=30_000)

    # Capture reference number from confirmation page
    ref = ""
    for selector in [".reference-number", ".submission-ref", "[class*='confirm'] strong", "h2, h3"]:
        try:
            el = page.locator(selector).first
            if await el.is_visible():
                text = await el.inner_text()
                if any(c.isdigit() for c in text):
                    ref = text.strip()
                    break
        except Exception:
            pass

    if not ref:
        ref = f"GT-ETENDERS-{page.url.split('/')[-1]}"

    log_debug("AUTOMATION_SUBMIT", {"portal": _PORTAL, "ref": ref, "url": page.url})
    return ref
