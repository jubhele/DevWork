from celery import Celery
from api.config import get_settings

settings = get_settings()

app = Celery(
    "govtender",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "crawler.scheduler",
        "crawler.portals.etenders",
        "crawler.portals.cidb",
        "crawler.portals.sita",
        "matcher.score",
    ],
)

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Africa/Johannesburg",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
)
