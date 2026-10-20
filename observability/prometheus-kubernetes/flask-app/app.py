import random
import time
from functools import wraps

from flask import Flask, Response, jsonify, request
from prometheus_client import (
    Counter,
    Gauge,
    Histogram,
    CONTENT_TYPE_LATEST,
    generate_latest,
)

app = Flask(__name__)

# 1. Total HTTP requests, labeled by method, endpoint, and status.
HTTP_REQUESTS = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

# 2. HTTP request duration histogram.
HTTP_REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5),
)

# 3. Requests currently executing.
HTTP_REQUESTS_IN_PROGRESS = Gauge(
    "http_requests_in_progress",
    "Number of HTTP requests currently being processed",
)

# 4. Responses by status code.
HTTP_RESPONSES = Counter(
    "http_responses_total",
    "HTTP responses by status code",
    ["status"],
)

# 5. HTTP 5xx errors.
HTTP_ERRORS = Counter(
    "http_errors_total",
    "HTTP 5xx responses",
    ["endpoint", "status"],
)

# 6. Successful business operations.
BUSINESS_OPERATIONS = Counter(
    "app_business_operations_total",
    "Business operations by operation and result",
    ["operation", "result"],
)

# 7. Business operation duration histogram.
BUSINESS_OPERATION_DURATION = Histogram(
    "app_business_operation_duration_seconds",
    "Business operation duration in seconds",
    ["operation"],
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5),
)

# 8. Simulated active-user gauge.
ACTIVE_USERS = Gauge(
    "app_active_users",
    "Simulated number of active users",
)

# 9. Items processed.
ITEMS_PROCESSED = Counter(
    "app_items_processed_total",
    "Total items processed",
    ["item_type"],
)

# 10. Cache requests by outcome.
CACHE_REQUESTS = Counter(
    "app_cache_requests_total",
    "Cache requests by outcome",
    ["outcome"],
)


@app.before_request
def before_request():
    if request.path != "/metrics":
        HTTP_REQUESTS_IN_PROGRESS.inc()
        request._metrics_started_at = time.perf_counter()


@app.after_request
def after_request(response):
    if request.path != "/metrics":
        endpoint = request.endpoint or "unknown"
        # Avoid high-cardinality URL paths; use Flask's route endpoint name.
        elapsed = time.perf_counter() - getattr(
            request, "_metrics_started_at", time.perf_counter()
        )
        status = str(response.status_code)

        HTTP_REQUESTS.labels(request.method, endpoint, status).inc()
        HTTP_REQUEST_DURATION.labels(request.method, endpoint).observe(elapsed)
        HTTP_RESPONSES.labels(status).inc()

        if response.status_code >= 500:
            HTTP_ERRORS.labels(endpoint, status).inc()

        HTTP_REQUESTS_IN_PROGRESS.dec()
    return response


@app.get("/")
def home():
    return jsonify(
        message="Flask Prometheus demo",
        endpoints=[
            "/work",
            "/process?count=5",
            "/cache?hit=true",
            "/users",
            "/simulate-error",
            "/metrics",
            "/healthz",
        ],
    )


@app.get("/work")
def work():
    """Simulate a business operation with variable latency."""
    started = time.perf_counter()
    try:
        time.sleep(random.uniform(0.02, 0.35))
        BUSINESS_OPERATIONS.labels("work", "success").inc()
        return jsonify(message="Work completed")
    except Exception:
        BUSINESS_OPERATIONS.labels("work", "failure").inc()
        raise
    finally:
        BUSINESS_OPERATION_DURATION.labels("work").observe(
            time.perf_counter() - started
        )


@app.get("/process")
def process_items():
    try:
        count = max(1, min(int(request.args.get("count", "5")), 1000))
    except ValueError:
        return jsonify(error="count must be an integer"), 400

    ITEMS_PROCESSED.labels("demo_item").inc(count)
    BUSINESS_OPERATIONS.labels("process_items", "success").inc()
    return jsonify(processed=count)


@app.get("/cache")
def cache():
    hit = request.args.get("hit", "true").lower() in ("true", "1", "yes")
    CACHE_REQUESTS.labels("hit" if hit else "miss").inc()
    return jsonify(cache="hit" if hit else "miss")


@app.get("/users")
def users():
    # Demonstration only: this is a simulated value, not real user tracking.
    ACTIVE_USERS.set(random.randint(1, 100))
    return jsonify(active_users_simulated=True)


@app.get("/simulate-error")
def simulate_error():
    # Use only for testing in your local lab.
    return jsonify(error="Simulated internal server error"), 500


@app.get("/healthz")
def healthz():
    return jsonify(status="ok"), 200


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    # Suitable for local development. Use Gunicorn for container deployment.
    app.run(host="0.0.0.0", port=5000, debug=False)
