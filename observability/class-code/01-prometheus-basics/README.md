# Demo 01 - Prometheus basics

```bash
docker compose up -d --build
open http://localhost:9090/targets      # shop/node UP, broken DOWN
curl -s localhost:5000/metrics | head
curl -s localhost:9100/metrics | grep node_load

# validate & hot reload config
docker compose exec prometheus promtool check config /etc/prometheus/prometheus.yml
curl -X POST localhost:9090/-/reload

# HTTP API
curl -s 'localhost:9090/api/v1/query?query=up' | python3 -m json.tool | head -30

docker compose down -v
```

## Queries to run live (Graph tab)

```promql
up
up == 0
shop_http_requests_total
rate(shop_http_requests_total[1m])
sum by (endpoint) (rate(shop_http_requests_total[1m]))
sum(rate(shop_http_requests_total{status=~"5.."}[1m])) / sum(rate(shop_http_requests_total[1m]))
histogram_quantile(0.95, sum by (le, endpoint) (rate(shop_http_request_duration_seconds_bucket[1m])))
rate(shop_http_request_duration_seconds_sum[1m]) / rate(shop_http_request_duration_seconds_count[1m])
shop_http_requests_in_progress
increase(shop_orders_total[5m])
sum by (payment_method) (rate(shop_orders_total[5m]))
rate(shop_order_amount_usd_sum[5m]) / rate(shop_order_amount_usd_count[5m])
100 - avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100
time() - process_start_time_seconds{job="shop"}
```
