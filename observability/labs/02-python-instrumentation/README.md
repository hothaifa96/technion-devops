# Lab 02: Instrument a Python App (all metric types)

## Objective

Add meaningful Prometheus metrics to a Python service using `prometheus_client`.

## Prerequisites

- Read [03-metric-types.md](../../materials/03-metric-types.md) and [04-python-client.md](../../materials/04-python-client.md)
- Reference: [class-code/02-python-client](../../class-code/02-python-client)

## The app

Build a small **library API** (Flask or FastAPI):
- `GET /books` - list (random latency 10-300ms)
- `POST /books/<id>/borrow` - 15% chance of `409 already borrowed`
- `POST /books/<id>/return`
- `GET /search?q=` - slow (200ms-2s)

## Exercise

### Step 1: RED metrics (middleware)
- `library_http_requests_total{method, endpoint, status}` - Counter
- `library_http_request_duration_seconds{endpoint}` - Histogram with buckets that make sense for your SLO (explain your choice)
- `library_http_requests_in_progress` - Gauge
Use the **route template** as `endpoint` (e.g. `/books/<id>/borrow`) - why not the real path?

### Step 2: Business metrics
- `library_books_borrowed_total{genre}` - Counter
- `library_books_available` - Gauge (inc/dec on borrow/return)
- `library_search_results` - Summary (number of results per search)
- `library_build_info{version, commit}` - Info

### Step 3: Decorators
- Use `.time()` on the search function
- Use `count_exceptions()` on a function that sometimes raises

### Step 4: Expose & scrape
1. Expose `/metrics` and scrape it with Prometheus (compose).
2. Generate load with a script (bash / `hey` / locust).

### Step 5: Queries
Write PromQL for:
1. RPS per endpoint
2. % of borrow requests that return 409
3. p95 latency of `/search`
4. Average number of search results
5. Books borrowed per genre in the last 15 minutes

### Step 6: Cardinality
1. Add a label `user_id` with random values to a counter and watch `prometheus_tsdb_head_series` grow. Explain why this is dangerous. Remove it.

## Challenge Exercise

1. Run the app with **gunicorn 4 workers** and fix the metrics using multiprocess mode.
2. Use `prometheus-flask-exporter` / `prometheus-fastapi-instrumentator` and compare to your manual metrics.

## Deliverables
App code, Dockerfile, compose, `queries.md`.
