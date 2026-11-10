import json
import logging
import os
import sys
import time

import psycopg2
from flask import Flask, Response, g, jsonify, request
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

DB = dict(
    host=os.getenv("DB_HOST", "postgres"),
    port=int(os.getenv("DB_PORT", "5432")),
    dbname=os.getenv("DB_NAME", "shop"),
    user=os.getenv("DB_USER", "shop"),
    password=os.getenv("DB_PASSWORD", "shop"),
    connect_timeout=3,
)


class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {"ts": self.formatTime(record), "level": record.levelname, "msg": record.getMessage()}
        payload.update(getattr(record, "extra", {}))
        return json.dumps(payload)


handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JsonFormatter())
log = logging.getLogger("backend")
log.addHandler(handler)
log.setLevel(logging.INFO)

REQUESTS = Counter("http_requests_total", "HTTP requests", ["method", "route", "status"])
LATENCY = Histogram("http_request_duration_seconds", "Request latency", ["route"])
ORDERS = Gauge("shop_orders_total", "Number of orders currently in the database")
DB_UP = Gauge("shop_db_up", "1 if the database is reachable")

app = Flask(__name__)


def query(sql, args=(), fetch=True):
    with psycopg2.connect(**DB) as conn, conn.cursor() as cur:
        cur.execute(sql, args)
        return cur.fetchall() if fetch else None


def init_db():
    for attempt in range(30):
        try:
            query(
                """CREATE TABLE IF NOT EXISTS orders (
                       id SERIAL PRIMARY KEY,
                       customer TEXT NOT NULL,
                       product TEXT NOT NULL,
                       amount NUMERIC(10,2) NOT NULL,
                       source TEXT NOT NULL DEFAULT 'api',
                       created_at TIMESTAMPTZ NOT NULL DEFAULT now())""",
                fetch=False,
            )
            log.info("database ready", extra={"extra": {"attempt": attempt}})
            return
        except psycopg2.OperationalError as e:
            log.warning("database not ready", extra={"extra": {"attempt": attempt, "error": str(e).strip()}})
            time.sleep(2)
    raise SystemExit("database never became ready")


@app.before_request
def start_timer():
    g.start = time.perf_counter()


@app.after_request
def record(response):
    route = request.url_rule.rule if request.url_rule else "unknown"
    REQUESTS.labels(request.method, route, response.status_code).inc()
    LATENCY.labels(route).observe(time.perf_counter() - g.start)
    if route not in ("/metrics", "/healthz", "/readyz"):
        log.info("request", extra={"extra": {"method": request.method, "path": request.path, "status": response.status_code}})
    return response


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/readyz")
def readyz():
    try:
        query("SELECT 1")
        return {"status": "ready"}
    except psycopg2.Error as e:
        return {"status": "db-unavailable", "error": str(e).strip()}, 503


@app.get("/api/orders")
def list_orders():
    rows = query("SELECT id, customer, product, amount, source, created_at FROM orders ORDER BY id DESC LIMIT 20")
    return jsonify([
        {"id": r[0], "customer": r[1], "product": r[2], "amount": float(r[3]), "source": r[4], "created_at": r[5].isoformat()}
        for r in rows
    ])


@app.post("/api/orders")
def create_order():
    body = request.get_json(force=True)
    if not body.get("customer") or not body.get("product"):
        return {"error": "customer and product are required"}, 400
    query(
        "INSERT INTO orders (customer, product, amount, source) VALUES (%s, %s, %s, 'api')",
        (body["customer"], body["product"], float(body.get("amount", 0))),
        fetch=False,
    )
    return {"status": "created"}, 201


@app.get("/api/stats")
def stats():
    rows = query("SELECT source, count(*), coalesce(sum(amount),0) FROM orders GROUP BY source")
    return jsonify({r[0]: {"orders": r[1], "revenue": float(r[2])} for r in rows})


@app.get("/metrics")
def metrics():
    try:
        ORDERS.set(query("SELECT count(*) FROM orders")[0][0])
        DB_UP.set(1)
    except psycopg2.Error:
        DB_UP.set(0)
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


init_db()
