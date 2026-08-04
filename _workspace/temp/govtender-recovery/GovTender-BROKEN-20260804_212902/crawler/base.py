"""
BaseCrawler — all portal crawlers inherit from this.
Provides: Playwright setup, rate limiting, retry logic, Pattern 21 debug hook integration.
"""
from __future__ import annotations

import asyncio
import random
from abc import ABC, abstractmethod
from typing import AsyncIterator

from api.debug import log_debug


class BaseCrawler(ABC):
    """Abstract base class for all GovTender portal crawlers."""

    portal_name: str = "unknown"
    min_delay_s: float = 2.0
    max_delay_s: float = 5.0
    max_retries: int = 3

    def __init__(self, headless: bool = True) -> None:
        self.headless = headless
        self._browser = None
        self._context = None
        self._page = None

    async def __aenter__(self) -> "BaseCrawler":
        from playwright.async_api import async_playwright

        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(headless=self.headless)
        self._context = await self._browser.new_context(
            user_agent=(
                "GovTender/0.1 (+https://govtender.co.za/bot) "
                "Mozilla/5.0 (compatible; GovTenderBot/0.1)"
            )
        )
        self._page = await self._context.new_page()
        log_debug("CRAWLER_INIT", {"portal": self.portal_name, "headless": self.headless})
        return self

    async def __aexit__(self, *_) -> None:
        if self._browser:
            await self._browser.close()
        if self._pw:
            await self._pw.stop()
        log_debug("CRAWLER_CLOSE", {"portal": self.portal_name})

    async def _goto(self, url: str, wait_for: str | None = None) -> None:
        """Navigate to URL with retry and rate-limit delay."""
        for attempt in range(1, self.max_retries + 1):
            try:
                log_debug("CRAWL_GOTO", {"portal": self.portal_name, "url": url, "attempt": attempt})
                await self._page.goto(url, wait_until="domcontentloaded", timeout=30_000)
                if wait_for:
                    await self._page.wait_for_selector(wait_for, timeout=15_000)
                # Randomised delay to be respectful to the portal
                await asyncio.sleep(random.uniform(self.min_delay_s, self.max_delay_s))
                return
            except Exception as exc:
                log_debug("CRAWL_GOTO_ERROR", {"portal": self.portal_name, "url": url, "attempt": attempt, "error": str(exc)})
                if attempt == self.max_retries:
                    raise

    @abstractmethod
    async def crawl(self) -> AsyncIterator[dict]:
        """Yield raw tender dicts. Each must be passable to Normaliser.normalize()."""
        ...
