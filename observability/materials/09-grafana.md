# Grafana

Open-source visualization & alerting platform. Queries **data sources** (doesn't store metrics itself).

```bash
docker run -d --name grafana -p 3000:3000 grafana/grafana:11.2.0
# login admin / admin
```

---

## Data sources

Prometheus, Loki, Tempo, Elasticsearch/OpenSearch, CloudWatch, InfluxDB, MySQL/PostgreSQL, Mimir, Jaeger...

Connections → Data sources → Add → Prometheus → URL `http://prometheus:9090` (container name / k8s service, **not** localhost).

---

## Dashboards & panels

| Panel | Use |
|-------|-----|
| **Time series** | trends (RPS, latency) |
| **Stat** | single big number (uptime, current RPS) |
| **Gauge** / **Bar gauge** | % of limit (CPU, disk) |
| **Table** | lists (top endpoints) |
| **Heatmap** | histogram buckets over time (latency distribution) |
| **Logs** | Loki logs |
| **Text** | markdown docs / runbook links |

Panel options: unit (`seconds`, `bytes`, `percent (0-1)`, `req/s`), thresholds (green/yellow/red), legend `{{endpoint}}`, min interval, overrides.

### Useful Grafana PromQL variables

| Variable | Meaning |
|----------|---------|
| `$__rate_interval` | safe range for `rate()` based on scrape interval - **use it** |
| `$__interval` | current step |
| `$__range` | dashboard time range |

```promql
sum by (endpoint) (rate(http_requests_total{job="$job", instance=~"$instance"}[$__rate_interval]))
```

---

## Template variables

Dashboard settings → Variables:

| Name | Type | Query |
|------|------|-------|
| `job` | Query | `label_values(up, job)` |
| `instance` | Query | `label_values(up{job="$job"}, instance)` (multi-value, include All) |
| `endpoint` | Query | `label_values(http_requests_total{job="$job"}, endpoint)` |
| `interval` | Interval | `1m,5m,15m` |

Use **Repeat by variable** to create one panel/row per value.

---

## Community dashboards

Dashboards → New → Import → ID:

| ID | Dashboard |
|----|-----------|
| 1860 | Node Exporter Full |
| 15760 / 15757 | Kubernetes views (kube-prometheus-stack) |
| 7587 | Blackbox exporter |
| 3662 | Prometheus 2.0 overview |

---

## Provisioning (dashboards as code)

```
grafana/
├── provisioning/
│   ├── datasources/datasource.yml
│   └── dashboards/dashboards.yml
└── dashboards/
    └── flask.json
```

```yaml
# provisioning/datasources/datasource.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    uid: prometheus
    url: http://prometheus:9090
    isDefault: true
```

```yaml
# provisioning/dashboards/dashboards.yml
apiVersion: 1
providers:
  - name: default
    folder: Course
    type: file
    options:
      path: /var/lib/grafana/dashboards
```

On Kubernetes (kube-prometheus-stack): a ConfigMap with label `grafana_dashboard: "1"` is auto-loaded by the Grafana sidecar.

Export a dashboard: Share → Export → *Export for sharing externally* → JSON in Git.

---

## Grafana Alerting

Alert rules on any data source → contact points (Slack, email, Teams, webhook) → notification policies (routing) → silences/mute timings. Similar concepts to Alertmanager.

Alert rule = query (A) → reduce (B: last/mean) → threshold (C: > 0.05) + pending period.

---

## Users & organization

Organizations, teams, folders with permissions, roles (Viewer, Editor, Admin), service accounts + tokens for API automation.

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/search?query=flask
```
