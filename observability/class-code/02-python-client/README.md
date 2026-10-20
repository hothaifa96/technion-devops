# Demo 02 - Python client: all metric types

```bash
pip install -r requirements.txt
python app.py
./load.sh            # in another terminal
curl -s localhost:5000/metrics | grep -E "^shop_" | head -40
```

| Metric | Type | Shows |
|--------|------|-------|
| `shop_http_requests_total` | Counter | RED - rate & errors (labels method/endpoint/status) |
| `shop_http_request_duration_seconds` | Histogram | RED - duration, `_bucket`, `_sum`, `_count` |
| `shop_http_requests_in_progress` | Gauge | inc/dec |
| `shop_cart_items` | Gauge | `set_function` callback |
| `shop_order_amount_usd` | Summary | `_sum` / `_count` |
| `shop_orders_total` | Counter | business metric |
| `shop_checkout_failures_total` | Counter | `count_exceptions()` decorator |
| `shop_build_info` | Info | version label |

Note: `endpoint` uses the **route rule** (`/products`), unknown URLs become `unmatched` → bounded cardinality.

Run with Prometheus: see [../01-prometheus-basics](../01-prometheus-basics).
