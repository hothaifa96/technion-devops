# Demo 04 - Blackbox exporter (probing from the outside)

```bash
docker compose up -d
# probe manually - this is what Prometheus does after relabeling:
curl -s "localhost:9115/probe?target=https://prometheus.io&module=http_2xx" | grep -E "^probe_"
curl -s "localhost:9115/probe?target=web:443&module=tcp_connect&debug=true"
open http://localhost:9090/targets
docker compose stop web          # watch probe_success go to 0
```

```promql
probe_success
probe_duration_seconds
probe_http_status_code
(probe_ssl_earliest_cert_expiry - time()) / 86400
avg_over_time(probe_success[10m]) * 100     # availability %
```
