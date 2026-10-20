# Lab 07: Grafana Dashboards as Code

## Objective

Build a production-quality service dashboard with variables, provision it as code and alert from Grafana.

## Prerequisites

- Read [09-grafana.md](../../materials/09-grafana.md)
- Reference: [class-code/07-grafana](../../class-code/07-grafana)

## Exercise

### Step 1: Setup
Start a stack with your instrumented app from lab 02, Prometheus, node-exporter and Grafana. Provision the Prometheus data source with a YAML file (no clicking).

### Step 2: Service dashboard
Create a dashboard **"<App> - Overview"** with:

| Row | Panel | Type |
|-----|-------|------|
| Golden signals | RPS | Stat |
| | Error ratio (thresholds 1% / 5%) | Stat |
| | p95 latency (thresholds) | Stat |
| | Uptime | Stat |
| Traffic | RPS by endpoint | Time series |
| | RPS by status code (2xx green, 4xx orange, 5xx red - overrides) | Time series (stacked) |
| Latency | p50/p95/p99 | Time series |
| | Latency distribution | Heatmap |
| Business | your business metrics | any |
| Host | CPU / memory / disk | Gauge |

Rules: correct **units** everywhere, legends with `{{label}}`, `$__rate_interval` in every `rate()`.

### Step 3: Variables
- `job` (query), `instance` (query, multi, All), `endpoint` (query, multi, All)
- A repeated row per `instance`

### Step 4: Provision
1. Export the dashboard JSON, put it in `grafana/dashboards/`, provision it with a dashboards provider.
2. `docker compose down -v && docker compose up -d` - is everything back without clicking?

### Step 5: Import
Import dashboard **1860** (Node Exporter Full) and **7587** (Blackbox). Which variables do they use?

### Step 6: Grafana alerting
1. Create a contact point (webhook / Slack / email).
2. Alert rule: error ratio > 5% for 2m, labels `severity=critical`.
3. Notification policy routing by `severity`.
4. Trigger it.

### Step 7: Annotations
Push a deployment annotation with the API when you redeploy the app:
```bash
curl -s -u admin:admin -H "Content-Type: application/json" -X POST localhost:3000/api/annotations \
  -d '{"tags":["deploy"],"text":"v1.2.0 deployed"}'
```
Show it on the dashboard.

## Challenge Exercise

1. On Kubernetes, ship your dashboard as a ConfigMap with label `grafana_dashboard: "1"` inside your app's Helm chart.
2. Generate the dashboard with code (grafanalib / Grafonnet / the Python script approach used in class).

## Deliverables
Dashboard JSON, provisioning files, screenshots.
