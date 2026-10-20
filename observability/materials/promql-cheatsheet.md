# PromQL Cheatsheet

| Goal | Query |
|------|-------|
| Is target up? | `up{job="flask-app"}` |
| Targets down | `up == 0` |
| RPS total | `sum(rate(http_requests_total[5m]))` |
| RPS per endpoint | `sum by (endpoint) (rate(http_requests_total[5m]))` |
| Error ratio | `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` |
| p95 latency | `histogram_quantile(0.95, sum by (le) (rate(app_request_duration_seconds_bucket[5m])))` |
| Avg latency | `rate(app_request_duration_seconds_sum[5m]) / rate(app_request_duration_seconds_count[5m])` |
| Requests last hour | `increase(http_requests_total[1h])` |
| Top 5 endpoints | `topk(5, sum by (endpoint) (rate(http_requests_total[5m])))` |
| CPU % (node) | `100 - avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100` |
| Memory % (node) | `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100` |
| Disk % (node) | `100 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100` |
| Disk full in 4h? | `predict_linear(node_filesystem_avail_bytes[1h], 4*3600) < 0` |
| Uptime (s) | `time() - process_start_time_seconds` |
| Pod restarts (1h) | `increase(kube_pod_container_status_restarts_total[1h]) > 0` |
| Pod CPU | `sum by (pod) (rate(container_cpu_usage_seconds_total{container!=""}[5m]))` |
| Pod memory | `sum by (pod) (container_memory_working_set_bytes{container!=""})` |
| Missing metric | `absent(up{job="flask-app"})` |
| HTTP probe failing | `probe_success == 0` |
| Cert expiry days | `(probe_ssl_earliest_cert_expiry - time()) / 86400` |
| Value 1 day ago | `sum(rate(http_requests_total[5m] offset 1d))` |
