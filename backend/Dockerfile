FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y
    gcc \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install
    pip install

FROM python:3.11-slim AS production

WORKDIR /app

COPY
ENV PATH="/opt/venv/bin:$PATH"

COPY . .

RUN addgroup
USER appuser

EXPOSE 8000

HEALTHCHECK
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
