# Exporters

An exporter translates metrics of a system that doesn't speak Prometheus into the Prometheus format on an HTTP `/metrics` endpoint.

```
MySQL ──(SQL queries)──▶ mysqld_exporter :9104/metrics ◀── scrape ── Prometheus
Linux ──(/proc, /sys)──▶ node_exporter   :9100/metrics ◀── scrape
```

---

## Popular exporters

| Exporter | Port | Exposes |
|----------|------|---------|
| **node_exporter** | 9100 | Linux host: CPU, memory, disk, network, filesystem |
| **windows_exporter** | 9182 | Windows host |
| **cAdvisor** | 8080 | per-container CPU/mem/net (built into kubelet) |
| **blackbox_exporter** | 9115 | probes from outside: HTTP, TCP, ICMP, DNS, TLS cert expiry |
| **kube-state-metrics** | 8080 | Kubernetes object state (deployments, pods, restarts) |
| mysqld / postgres / redis / mongodb exporters | 9104 / 9187 / 9121 / 9216 | databases |
| nginx / haproxy exporters | | web servers |
| **pushgateway** | 9091 | metrics pushed by batch jobs |
| **json_exporter** | 7979 | scrape any JSON API via JSONPath |
| **CloudWatch exporter / YACE** | | AWS metrics |

Full list: https://prometheus.io/docs/instrumenting/exporters/

---

## node_exporter

```bash
docker run -d --name node-exporter --net host --pid host \
  -v /:/host:ro,rslave quay.io/prometheus/node-exporter:latest --path.rootfs=/host
curl localhost:9100/metrics | grep node_load
```

Key metrics: `node_cpu_seconds_total`, `node_memory_MemAvailable_bytes`, `node_filesystem_avail_bytes`, `node_network_receive_bytes_total`, `node_load1`.

Textfile collector: drop `*.prom` files into a directory (`--collector.textfile.directory`) to expose custom values from cron scripts.

---

## blackbox_exporter (multi-target pattern)

The exporter probes the target given as a URL parameter: `/probe?target=https://example.com&module=http_2xx`.

```yaml
# blackbox.yml
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_status_codes: [200]
      preferred_ip_protocol: ip4
  tcp_connect:
    prober: tcp
```

```yaml
# prometheus.yml
- job_name: blackbox-http
  metrics_path: /probe
  params:
    module: [http_2xx]
  static_configs:
    - targets: ["https://www.technion.ac.il", "http://app:5000/health"]
  relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target         # pass the target as ?target=
    - source_labels: [__param_target]
      target_label: instance               # keep a readable instance label
    - target_label: __address__
      replacement: blackbox:9115           # actually scrape the exporter
```

Metrics: `probe_success`, `probe_duration_seconds`, `probe_http_status_code`, `probe_ssl_earliest_cert_expiry`.

```promql
(probe_ssl_earliest_cert_expiry - time()) / 86400 < 14     # cert expires in < 14 days
```

---

## Writing a custom exporter (Python)

```python
import time, requests
from prometheus_client import start_http_server
from prometheus_client.core import GaugeMetricFamily, CounterMetricFamily, REGISTRY

class GitHubCollector:
    def __init__(self, repos):
        self.repos = repos

    def collect(self):
        stars = GaugeMetricFamily("github_repo_stars", "Stars", labels=["repo"])
        issues = GaugeMetricFamily("github_repo_open_issues", "Open issues", labels=["repo"])
        for repo in self.repos:
            data = requests.get(f"https://api.github.com/repos/{repo}", timeout=5).json()
            stars.add_metric([repo], data["stargazers_count"])
            issues.add_metric([repo], data["open_issues_count"])
        yield stars
        yield issues

REGISTRY.register(GitHubCollector(["prometheus/prometheus", "grafana/grafana"]))
start_http_server(9200)
while True:
    time.sleep(60)
```

See [class-code/03-custom-exporter](../class-code/03-custom-exporter).

### Exporter guidelines
- Fetch data **on scrape** in `collect()` (or cache if expensive)
- Expose an `*_up` / `*_scrape_success` metric for the backend health
- One exporter per instance of the monitored system, run next to it
- Don't add `job`/`instance` labels yourself
