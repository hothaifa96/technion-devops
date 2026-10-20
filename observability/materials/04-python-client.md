# Python Client Library (prometheus_client)

```bash
pip install prometheus-client
```

---

## The four metric types

```python
from prometheus_client import Counter, Gauge, Histogram, Summary, Info

REQUESTS = Counter("app_requests_total", "Total requests", ["method", "endpoint", "status"])
IN_PROGRESS = Gauge("app_requests_in_progress", "Requests being processed")
LATENCY = Histogram("app_request_duration_seconds", "Request latency", ["endpoint"],
                    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2.5, 5))
PAYLOAD = Summary("app_payload_bytes", "Payload size")
BUILD = Info("app_build", "Build information")

REQUESTS.labels(method="GET", endpoint="/", status="200").inc()
REQUESTS.labels("POST", "/order", "500").inc(2)
IN_PROGRESS.inc(); IN_PROGRESS.dec(); IN_PROGRESS.set(5)
LATENCY.labels(endpoint="/").observe(0.231)
PAYLOAD.observe(512)
BUILD.info({"version": "1.4.2", "commit": "ab12cd3"})
```

## Decorators & context managers

```python
@LATENCY.labels(endpoint="/slow").time()
def slow():
    ...

@IN_PROGRESS.track_inprogress()
def work():
    ...

FAILURES = Counter("app_failures_total", "Failures")
@FAILURES.count_exceptions()
def risky():
    ...

with LATENCY.labels(endpoint="/db").time():
    query()
```

## Gauge from a callback

```python
QUEUE = Gauge("app_queue_length", "Items in queue")
QUEUE.set_function(lambda: len(queue))
```

---

## Exposing /metrics

### Standalone HTTP server (scripts, workers)

```python
from prometheus_client import start_http_server
start_http_server(8000)          # serves http://0.0.0.0:8000/metrics
```

### Flask

```python
from flask import Flask, Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)
```

or mount the WSGI app:

```python
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from prometheus_client import make_wsgi_app
app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {"/metrics": make_wsgi_app()})
```

### FastAPI

```python
from prometheus_client import make_asgi_app
app.mount("/metrics", make_asgi_app())
```

### Automatic HTTP metrics

```python
# pip install prometheus-flask-exporter
from prometheus_flask_exporter import PrometheusMetrics
metrics = PrometheusMetrics(app)   # adds flask_http_request_duration_seconds etc.
```

---

## Recording request metrics in Flask (middleware)

```python
import time
from flask import request, g

@app.before_request
def start_timer():
    g.start = time.perf_counter()
    IN_PROGRESS.inc()

@app.after_request
def record(response):
    endpoint = str(request.url_rule) if request.url_rule else "unmatched"   # avoid cardinality explosion
    LATENCY.labels(endpoint=endpoint).observe(time.perf_counter() - g.start)
    REQUESTS.labels(request.method, endpoint, response.status_code).inc()
    IN_PROGRESS.dec()
    return response
```

---

## Default metrics

The client automatically exports `process_*` (CPU, memory, open fds) and `python_gc_*`, `python_info`.

## Multiprocess (gunicorn)

Each worker has its own memory → set `PROMETHEUS_MULTIPROC_DIR` and use `MultiProcessCollector`:

```python
from prometheus_client import CollectorRegistry, multiprocess, generate_latest
registry = CollectorRegistry()
multiprocess.MultiProcessCollector(registry)
```

---

## Custom collector (for exporters)

```python
from prometheus_client.core import GaugeMetricFamily, REGISTRY

class WeatherCollector:
    def collect(self):
        g = GaugeMetricFamily("weather_temperature_celsius", "Temperature", labels=["city"])
        g.add_metric(["haifa"], fetch_temp("haifa"))
        yield g

REGISTRY.register(WeatherCollector())
```

`collect()` is called on **every scrape** → values are always fresh.

## Push to Pushgateway (batch jobs)

```python
from prometheus_client import CollectorRegistry, Gauge, push_to_gateway
registry = CollectorRegistry()
g = Gauge("backup_last_success_timestamp_seconds", "Last backup", registry=registry)
g.set_to_current_time()
push_to_gateway("pushgateway:9091", job="nightly-backup", registry=registry)
```
