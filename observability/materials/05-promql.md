# PromQL

## Data types

| Type | Example | Returns |
|------|---------|---------|
| Instant vector | `up` | one sample per series at "now" |
| Range vector | `up[5m]` | samples over the last 5m per series |
| Scalar | `42` | number |
| String | `"x"` | rarely used |

> Graphs need instant vectors. Range vectors must be wrapped with a function (`rate`, `avg_over_time`...).

---

## Selectors

```promql
http_requests_total
http_requests_total{job="flask-app"}
http_requests_total{status="500", method!="GET"}
http_requests_total{endpoint=~"/api/.*"}          # regex match
http_requests_total{status!~"2.."}                # regex not match
{__name__=~"node_.*_bytes"}
http_requests_total offset 1h                     # value 1 hour ago
http_requests_total @ 1729425600                  # at a timestamp
```

---

## Rate & friends (counters)

```promql
rate(http_requests_total[5m])            # per-second average over 5m (use for graphs/alerts)
irate(http_requests_total[5m])           # per-second from the last 2 samples (spiky)
increase(http_requests_total[1h])        # total increase over 1h
```

> Range should be ≥ 4× scrape interval. Always `rate` **before** `sum`.

## Gauges

```promql
avg_over_time(node_load1[10m])
max_over_time(queue_length[1h])
delta(temperature_celsius[1h])
deriv(node_filesystem_avail_bytes[1h])
predict_linear(node_filesystem_avail_bytes[6h], 24*3600) < 0     # disk full within 24h?
```

---

## Aggregation

```promql
sum(rate(http_requests_total[5m]))                         # total RPS
sum by (endpoint) (rate(http_requests_total[5m]))          # RPS per endpoint
sum without (instance) (rate(http_requests_total[5m]))
avg by (instance) (node_load1)
max(container_memory_usage_bytes)
count(up == 1)
topk(5, sum by (endpoint) (rate(http_requests_total[5m])))
bottomk(3, ...)
quantile(0.9, ...)
count_values("version", app_build_info)
```

---

## Operators

```promql
# arithmetic
node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# comparison (filter)
up == 0
rate(http_requests_total[5m]) > 10
# bool modifier returns 0/1 instead of filtering
up == bool 0

# logical
up{job="a"} and up{job="b"}
metric_a unless metric_b
```

### Vector matching

```promql
# error ratio - labels must match on both sides
sum by (endpoint) (rate(http_requests_total{status=~"5.."}[5m]))
  /
sum by (endpoint) (rate(http_requests_total[5m]))

# ignoring / on
rate(errors_total[5m]) / ignoring(type) rate(requests_total[5m])
# many-to-one join with group_left
rate(http_requests_total[5m]) * on(instance) group_left(version) app_build_info
```

---

## Histograms

```promql
# p95 latency overall
histogram_quantile(0.95, sum by (le) (rate(app_request_duration_seconds_bucket[5m])))

# p99 per endpoint
histogram_quantile(0.99, sum by (le, endpoint) (rate(app_request_duration_seconds_bucket[5m])))

# average latency
rate(app_request_duration_seconds_sum[5m]) / rate(app_request_duration_seconds_count[5m])

# % of requests faster than 250ms (SLI)
sum(rate(app_request_duration_seconds_bucket{le="0.25"}[5m])) / sum(rate(app_request_duration_seconds_count[5m]))
```

---

## Useful functions

| Function | Use |
|----------|-----|
| `absent(up{job="x"})` | alert when a series disappears |
| `changes(x[1h])` | number of value changes (restarts) |
| `resets(counter[1h])` | counter resets |
| `label_replace(v, "dst", "$1", "src", "(.*):.*")` | create/modify labels |
| `clamp_min(v, 0)`, `clamp_max` | bound values |
| `round`, `ceil`, `floor`, `abs` | math |
| `time()` | current unix time - `time() - process_start_time_seconds` = uptime |
| `vector(0)` | constant vector (e.g. `or vector(0)`) |
| `sort`, `sort_desc` | ordering |

---

## Subqueries

```promql
max_over_time(rate(http_requests_total[5m])[1h:1m])   # peak 5m-rate during the last hour
```

---

## Classic queries

```promql
# Golden signals for a service
sum(rate(http_requests_total{job="flask-app"}[5m]))                                      # traffic
sum(rate(http_requests_total{job="flask-app",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="flask-app"}[5m]))  # errors
histogram_quantile(0.95, sum by (le)(rate(app_request_duration_seconds_bucket[5m])))     # latency

# Node CPU usage %
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
# Disk usage %
100 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100

# Kubernetes: restarts in the last hour
increase(kube_pod_container_status_restarts_total[1h]) > 0
# Pod CPU (cores)
sum by (pod) (rate(container_cpu_usage_seconds_total{namespace="dev", container!=""}[5m]))
```
