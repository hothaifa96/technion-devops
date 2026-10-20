# Metric Types

| Type | Goes | Use for | Query with |
|------|------|---------|-----------|
| **Counter** | only up (resets to 0 on restart) | requests, errors, bytes sent | `rate()`, `increase()` |
| **Gauge** | up and down | temperature, memory, queue size, in-flight requests | raw value, `avg_over_time()` |
| **Histogram** | buckets (counters) | latency, request size - aggregatable percentiles | `histogram_quantile()` |
| **Summary** | client-side quantiles | latency when you can't aggregate | read quantile directly |

---

## Counter

```
http_requests_total
   ▲          ╱
   │        ╱
   │     ╱        ← restart → drops to 0, rate() handles resets
   │  ╱     ╱
   └────────────▶ time
```

- Name with `_total` suffix
- Never use the raw value - use `rate(http_requests_total[5m])` (per-second) or `increase(...[1h])`

## Gauge

```
memory_usage_bytes  ╱╲    ╱╲
                   ╱  ╲__╱  ╲___
```

- Can `set()`, `inc()`, `dec()`
- Examples: `node_memory_MemAvailable_bytes`, `queue_length`, `in_progress_requests`

---

## Histogram

Counts observations into **cumulative** buckets (`le` = less or equal).

```
http_request_duration_seconds_bucket{le="0.1"}   240
http_request_duration_seconds_bucket{le="0.25"}  290
http_request_duration_seconds_bucket{le="0.5"}   298
http_request_duration_seconds_bucket{le="1"}     300
http_request_duration_seconds_bucket{le="+Inf"}  300
http_request_duration_seconds_sum                31.7
http_request_duration_seconds_count              300
```

- 240 of 300 requests took ≤ 100ms
- Average = `_sum / _count`
- p95 (estimated, server side, aggregatable across pods):

```promql
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
```

- Choose buckets around your SLO (e.g. 0.05, 0.1, 0.25, 0.5, 1, 2.5)
- Native histograms (Prometheus 2.40+, experimental) use exponential buckets automatically

## Summary

```
rpc_duration_seconds{quantile="0.5"}   0.012
rpc_duration_seconds{quantile="0.99"}  0.230
rpc_duration_seconds_sum               ...
rpc_duration_seconds_count             ...
```

- Quantiles computed **in the app** → cheap to query, **cannot be aggregated** across instances
- Python client's Summary only exposes `_sum` and `_count` (no quantiles)

---

## Histogram vs Summary

| | Histogram | Summary |
|---|---|---|
| Quantile computed | server (PromQL) | client |
| Aggregate across pods | ✔ | ✘ |
| Need to pick buckets | ✔ | ✘ |
| Accuracy | depends on buckets | configurable error |
| Recommended | ✔ usually | rarely |

---

## Naming conventions

- `snake_case`, prefix with app/domain: `shop_orders_total`
- Base units: `_seconds`, `_bytes`, `_celsius` (not ms / MB)
- Counters end with `_total`
- Labels for dimensions, not for unbounded values
