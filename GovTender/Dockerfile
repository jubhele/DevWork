FROM python:3.11-slim

WORKDIR /app

# System deps for Playwright, WeasyPrint, and psycopg
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 libffi-dev shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

# Playwright browser (Chromium only — lightest)
RUN playwright install chromium --with-deps

COPY . .

RUN mkdir -p uploads/proposals

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
