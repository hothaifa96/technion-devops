FROM python:3.12-slim

LABEL course="devops-technion" topic="dockerfile"

ARG APP_VERSION=1.0
ENV APP_VERSION=${APP_VERSION} \
    APP_PORT=5000 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# dependencies first -> layer cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

CMD ["python", "app.py"]
