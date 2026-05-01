FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    libxml2-dev \
    libxslt-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.6 /uv /usr/local/bin/uv

ENV UV_PROJECT_ENVIRONMENT=/opt/venv
ENV UV_LINK_MODE=copy

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev --no-install-project

COPY . .

ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

EXPOSE 5000

CMD ["uv", "run", "gunicorn", "--workers", "4", "--bind", "0.0.0.0:5000", "api_server:app"]
