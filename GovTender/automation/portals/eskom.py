"""
Eskom Supplier Zone form automation — eskomsupplierzone.com
Submits tender proposals via the Eskom supplier portal.
"""
from __future__ import annotations

from playwright.async_api import async_playwright, Page

from api.debug import log_debug
from automation.vault import load_credential

_BASE_URL = "https://www.eskomsupplierzone.com"
_LOGIN_URL = f"{_BASE_URL}/login"
_PORTAL = "eskom"


async def submit(
    subscriber_id: str,
    tender_ref: str,
    tender_url: str,
    docx_path: str,
    pdf_path: str,
    subscriber: dict,
) -> str:
    """Submit an Eskom tender proposal. Returns the submission reference."""
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
            await _navigate_to_tender(page, tender_url)
            ref = await _fill_and_submit(page, subscriber, docx_path, pdf_path)
        finally:
            await browser.close()

    log_debug("AUTOMATION_DONE", {"portal": _PORTAL, "ref": ref})
    return ref


async def _login(page: Page, username: str, password: str) -> None:
    await page.goto(_LOGIN_URL, wait_until="domcontentloaded")
    await page.wait_for_selector("#UserName, input[name='username'], input[type='email']", timeout=15_000)
    await page.fill("#UserName, input[name='username'], input[type='email']", username)
    await page.fill("#Password, input[name='password'], input[type='password']", password)
    await page.click("input[type='submit'], button[type='submit'], .login-button")
    await page.wait_for_load_state("networkidle", timeout=20_000)

    if "login" in page.url.lower():
        raise RuntimeError(f"Eskom Supplier Zone login failed for {username} — check vault")

    log_debug("AUTOMATION_LOGIN", {"portal": _PORTAL, "status": "ok"})


async def _navigate_to_tender(page: Page, tender_url: str) -> None:
    await page.goto(tender_url, wait_until="domcontentloaded")
    # Eskom uses a "Register Interest" step before submission
    try:
        register_btn = page.locator("a:has-text('Register Interest'), button:has-text('Register Interest')")
        if await register_btn.is_visible():
            await register_btn.click()
            await page.wait_for_load_state("networkidle", timeout=15_000)
    except Exception:
        pass


async def _fill_and_submit(page: Page, subscriber: dict, docx_path: str, pdf_path: str) -> str:
    for selector, value in [
        ("input[name='CompanyName'], input[placeholder*='company']", subscriber.get("company_name", "")),
        ("input[name='VatNumber'], input[placeholder*='VAT']", ""),
        ("input[name='ContactPerson']", subscriber.get("company_name", "")),
        ("input[name='CSDNumber']", subscriber.get("csd_number", "")),
    ]:
        try:
            el = page.locator(selector).first
            if await el.is_visible():
                await el.fill(value)
        except Exception:
            pass

    for file_path in [pdf_path, docx_path]:
        if not file_path:
            continue
        try:
            upload = page.locator("input[type='file']").first
            if await upload.is_visible():
                await upload.set_input_files(file_path)
                break
        except Exception:
            pass

    await page.click("input[type='submit'], button[type='submit']:has-text('Submit')")
    await page.wait_for_load_state("networkidle", timeout=30_000)

    ref = ""
    for selector in [".confirmation-number", ".reference", "[class*='success'] b", "h3"]:
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
        ref = f"GT-ESKOM-{page.url.split('/')[-1]}"

    log_debug("AUTOMATION_SUBMIT", {"portal": _PORTAL, "ref": ref})
    return ref
