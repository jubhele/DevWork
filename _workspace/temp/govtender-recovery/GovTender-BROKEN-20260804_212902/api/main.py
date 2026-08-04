from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import get_settings
from api.debug import log_debug

settings = get_settings()

app = FastAPI(
    title="GovTender API",
    version="0.1.0",
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        settings.app_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    log_debug("APP_START", {"env": settings.app_env, "version": "0.1.0"})


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "env": settings.app_env}


# Route registration — imported here to avoid circular imports
from api import tenders, proposals, subscribers, webhooks  # noqa: E402

app.include_router(tenders.router, prefix="/tenders", tags=["tenders"])
app.include_router(proposals.router, prefix="/proposals", tags=["proposals"])
app.include_router(subscribers.router, prefix="/subscribers", tags=["subscribers"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
