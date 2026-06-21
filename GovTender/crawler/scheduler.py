"""
Celery beat schedule — defines nightly crawl and post-crawl match trigger.
Runs in Africa/Johannesburg timezone.
"""
from celery.schedules import crontab
from crawler.celery_app import app
from api.debug import log_debug


app.conf.beat_schedule = {
    # Nightly crawls (staggered to avoid hammering portals simultaneously)
    "crawl-etenders-nightly": {
        "task": "crawler.portals.etenders.crawl_etenders",
        "schedule": crontab(hour=0, minute=0),
    },
    "crawl-cidb-nightly": {
        "task": "crawler.portals.cidb.crawl_cidb",
        "schedule": crontab(hour=0, minute=30),
    },
    "crawl-sita-nightly": {
        "task": "crawler.portals.sita.crawl_sita",
        "schedule": crontab(hour=1, minute=0),
    },
    # Post-crawl: run matcher at 03:00 (after all crawls complete)
    "run-matcher-nightly": {
        "task": "matcher.score.run_nightly_scoring",
        "schedule": crontab(hour=3, minute=0),
    },
    # Send daily digest at 06:00 (subscribers see it when they wake up)
    "send-digest-daily": {
        "task": "matcher.digest.send_daily_digest",
        "schedule": crontab(hour=6, minute=0),
    },
}


@app.task(name="crawler.scheduler.run_nightly_crawl")
def run_nightly_crawl() -> dict:
    """Manual trigger: runs all crawlers sequentially."""
    from crawler.portals.etenders import crawl_etenders
    from crawler.portals.cidb import crawl_cidb

    log_debug("NIGHTLY_CRAWL_START", {})
    results = {}
    results["etenders"] = crawl_etenders.delay()
    results["cidb"] = crawl_cidb.delay()
    log_debug("NIGHTLY_CRAWL_QUEUED", {"portals": list(results.keys())})
    return {"queued": list(results.keys())}
