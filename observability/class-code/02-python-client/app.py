"""
Flask "shop" app instrumented with every prometheus_client metric type.

Endpoints:
  /            fast
  /products    random latency 50-400ms
  /checkout    slow + ~10% errors
  /orders      POST, increments business counter
  /metrics     Prometheus exposition
"""
import os
import random
import time

from flask import Flask, Response, g, jsonify, request
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    Info,
    Summary,
    generate_latest,
)

app = Flask(__name__)

# ---------- metric definitions ----------
REQUESTS = Counter(
    "shop_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)
LATENCY = Histogram(
    "shop_http_request_duration_seconds",
    "HTTP request latency",
    ["endpoint"],
    buckets=(0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5),
)
IN_PROGRESS = Gauge("shop_http_requests_in_progress", "Requests currently being handled")
ORDER_AMOUNT = Summary("shop_order_amount_usd", "Order amount in USD")
ORDERS = Counter("shop_orders_total", "Orders created", ["payment_method"])
CART_ITEMS = Gauge("shop_cart_items", "Items currently in all carts")
CHECKOUT_FAILURES = Counter("shop_checkout_failures_total", "Checkout exceptions")
BUILD = Info("shop_build", "Build information")

BUILD.info({"version": os.getenv("APP_VERSION", "1.0.0"), "env": os.getenv("APP_ENV", "dev")})
CART_ITEMS.set_function(lambda: random.randint(0, 50))   # callback gauge, evaluated on scrape


# ---------- middleware: RED metrics for every request ----------
@app.before_request
def before():
    g.start = time.perf_counter()
    IN_PROGRESS.inc()


@app.after_request
def after(response):
    endpoint = str(request.url_rule) if request.url_rule else "unmatched"
    if endpoint != "/metrics":
        LATENCY.labels(endpoint=endpoint).observe(time.perf_counter() - g.start)
        REQUESTS.labels(request.method, endpoint, response.status_code).inc()
    IN_PROGRESS.dec()
    return response


# ---------- routes ----------
@app.get("/")
def home():
    return jsonify(service="shop", status="up")


@app.get("/products")
def products():
    time.sleep(random.uniform(0.05, 0.4))
    return jsonify(products=["laptop", "phone", "headphones"])


@app.get("/checkout")
@CHECKOUT_FAILURES.count_exceptions()
def checkout():
    time.sleep(random.uniform(0.2, 1.2))
    if random.random() < 0.1:
        raise RuntimeError("payment provider timeout")
    return jsonify(result="paid")


@app.post("/orders")
def orders():
    amount = round(random.uniform(5, 500), 2)
    method = random.choice(["card", "paypal", "bit"])
    ORDER_AMOUNT.observe(amount)
    ORDERS.labels(payment_method=method).inc()
    return jsonify(amount=amount, method=method), 201


@app.errorhandler(RuntimeError)
def handle_error(err):
    return jsonify(error=str(err)), 500


@app.get("/health")
def health():
    return jsonify(status="ok")


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
