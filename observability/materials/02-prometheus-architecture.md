# Prometheus Architecture & Configuration

## Architecture

```
                     ┌──────────────────── Prometheus server ─────────────────────┐
 targets             │                                                            │
 /metrics  ◀─scrape──│  Retrieval ──▶ TSDB (local disk) ◀── PromQL engine ◀── HTTP API / UI :9090
 (apps, exporters)   │      ▲                                   │                 │
                     │  Service discovery                  Rules evaluation        │
                     │  (static, k8s, ec2, consul, file)        │                 │
                     └──────────────────────────────────────────┼─────────────────┘
 short-lived jobs ──push──▶ Pushgateway ◀─scrape                 ▼
                                                           Alertmanager ──▶ Slack/Email/PagerDuty
                                           Grafana ──PromQL──▶ Prometheus
```

| Component | Role |
|-----------|------|
| **Prometheus server** | scrapes, stores (TSDB), evaluates rules, serves PromQL |
| **Exporters** | expose metrics of 3rd party systems (node, mysql, blackbox...) |
| **Client libraries** | instrument your own code (Python, Go, Java, Node) |
| **Pushgateway** | receives pushed metrics from batch jobs |
| **Alertmanager** | dedupes, groups, routes, silences alerts |
| **Grafana** | visualization |

---

## Data model

A **time series** = metric name + set of labels → stream of (timestamp, float64) samples.

```
http_requests_total{method="GET", endpoint="/food", status="200", instance="app:5000", job="flask"}  1027 @1729425600
└──── metric name ─┘└──────────────────────────── labels ───────────────────────────────────┘ value   timestamp
```

- `job` and `instance` labels are added by Prometheus on scrape
- Every unique label combination = new time series → **avoid high-cardinality labels** (user_id, request_id, full URL)

## Exposition format

```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1027
http_requests_total{method="POST",status="500"} 3
```

---

## prometheus.yml

```yaml
global:
  scrape_interval: 15s        # how often to scrape
  evaluation_interval: 15s    # how often to evaluate rules
  scrape_timeout: 10s
  external_labels:
    cluster: technion-lab

rule_files:
  - /etc/prometheus/rules/*.yml

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: flask-app
    metrics_path: /metrics      # default
    scheme: http                # default
    scrape_interval: 5s         # override
    static_configs:
      - targets: ["app:5000"]
        labels:
          env: dev

  - job_name: node
    static_configs:
      - targets: ["node-exporter:9100", "10.0.1.15:9100"]
```

---

## Run it

```bash
docker run -d --name prometheus -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus:v2.54.1

# validate config
docker run --rm -v $(pwd):/cfg --entrypoint promtool prom/prometheus:v2.54.1 check config /cfg/prometheus.yml

# reload without restart (needs --web.enable-lifecycle)
curl -X POST localhost:9090/-/reload
```

UI pages: **Graph**, **Alerts**, **Status → Targets** (UP/DOWN + last error), **Status → Configuration**, **Status → Service Discovery**, **Status → TSDB status**.

---

## Storage

- Local TSDB in `/prometheus`, 2h blocks compacted over time
- Default retention 15 days: `--storage.tsdb.retention.time=30d` / `--storage.tsdb.retention.size=50GB`
- Not designed for long-term / HA storage → **remote_write** to Thanos, Cortex, Mimir, VictoriaMetrics, AWS AMP

---

## Auto-generated metrics per target

| Metric | Meaning |
|--------|---------|
| `up` | 1 = scrape succeeded, 0 = failed |
| `scrape_duration_seconds` | scrape time |
| `scrape_samples_scraped` | number of samples |
