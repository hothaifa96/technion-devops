# Observability (Prometheus & Grafana) - Full Cheat Sheet

> Query-only quick table: [promql-cheatsheet.md](promql-cheatsheet.md)

## Concepts

| Term | Meaning |
|------|---------|
| Metrics / Logs / Traces | numbers over time / events / request paths |
| Golden signals | latency, traffic, errors, saturation |
| RED (services) | Rate, Errors, Duration |
| USE (resources) | Utilization, Saturation, Errors |
| SLI / SLO / SLA | measured indicator / internal target / contract |
| Error budget | 100% − SLO (99.9% → ~43 min / 30 days) |
| Time series | metric name + labels → (timestamp, float64) samples |
| Target / Job / Instance | scraped endpoint / group of targets / `host:port` |
| Cardinality | number of unique label combinations = number of series |

## Default ports

| Component | Port |
|-----------|------|
| Prometheus | 9090 |
| Alertmanager | 9093 |
| Pushgateway | 9091 |
| node_exporter | 9100 |
| blackbox_exporter | 9115 |
| cAdvisor | 8080 |
| kube-state-metrics | 8080 |
| Grafana | 3000 |
| Loki / Tempo (OTLP) | 3100 / 4317-4318 |

---

## Prometheus - run & operate

```bash
docker run -d --name prometheus -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  -v prom-data:/prometheus \
  prom/prometheus:v2.54.1 \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.retention.time=15d \
  --web.enable-lifecycle

promtool check config prometheus.yml
promtool check rules rules/*.yml
promtool test rules tests.yml
promtool query instant http://localhost:9090 'up'
curl -X POST localhost:9090/-/reload            # needs --web.enable-lifecycle
curl localhost:9090/-/healthy ; curl localhost:9090/-/ready
```

UI: Graph · Alerts · Status → Targets / Configuration / Rules / Service Discovery / TSDB Status / Flags.

### HTTP API

```bash
curl 'localhost:9090/api/v1/query?query=up'
curl 'localhost:9090/api/v1/query_range?query=rate(http_requests_total[5m])&start=2026-10-20T10:00:00Z&end=2026-10-20T11:00:00Z&step=60s'
curl 'localhost:9090/api/v1/targets'
curl 'localhost:9090/api/v1/label/job/values'
curl 'localhost:9090/api/v1/series?match[]=up'
curl 'localhost:9090/api/v1/alerts'
curl 'localhost:9090/api/v1/rules'
```

---

## prometheus.yml

```yaml
global:
  scrape_interval: 15s
  scrape_timeout: 10s           # must be <= scrape_interval
  evaluation_interval: 15s
  external_labels: { cluster: prod-eu }

rule_files: ["/etc/prometheus/rules/*.yml"]

alerting:
  alertmanagers:
    - static_configs: [{ targets: ["alertmanager:9093"] }]

scrape_configs:
  - job_name: app
    metrics_path: /metrics      # default
    scheme: http                # default
    scrape_interval: 5s
    honor_labels: false
    static_configs:
      - targets: ["app:5000", "app2:5000"]
        labels: { env: dev, team: shop }
    basic_auth: { username: prom, password_file: /etc/prom/pass }
    # bearer_token_file / tls_config / params

  - job_name: files
    file_sd_configs: [{ files: ["/etc/prometheus/targets/*.json"], refresh_interval: 1m }]

  - job_name: ec2
    ec2_sd_configs: [{ region: us-east-1, port: 9100, filters: [{ name: "tag:monitoring", values: ["true"] }] }]
    relabel_configs:
      - { source_labels: [__meta_ec2_tag_Name], target_label: name }

  - job_name: k8s-pods
    kubernetes_sd_configs: [{ role: pod }]          # node | pod | service | endpoints | endpointslice | ingress
    relabel_configs:
      - { source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape], action: keep, regex: "true" }
      - { source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path], target_label: __metrics_path__, regex: (.+) }
      - { action: labelmap, regex: __meta_kubernetes_pod_label_(.+) }
      - { source_labels: [__meta_kubernetes_namespace], target_label: namespace }
      - { source_labels: [__meta_kubernetes_pod_name], target_label: pod }
    metric_relabel_configs:
      - { source_labels: [__name__], regex: "go_gc_.*", action: drop }

remote_write:
  - url: http://mimir:9009/api/v1/push
```

File SD target file:

```json
[{ "targets": ["10.0.1.5:9100"], "labels": { "env": "prod" } }]
```

### Relabel actions

| Action | Effect |
|--------|--------|
| `replace` (default) | `target_label` ← regex(`source_labels`) with `replacement` |
| `keep` / `drop` | keep/drop targets (or samples in metric_relabel) |
| `labelmap` | copy labels matching regex (`$1`) |
| `labeldrop` / `labelkeep` | remove/keep labels by name regex |
| `hashmod` | sharding |
| `lowercase` / `uppercase` | case |

Special labels: `__address__` `__metrics_path__` `__scheme__` `__param_<x>` `__scrape_interval__` `__meta_*` (dropped after relabeling).

---

## Exposition format

```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1027
http_request_duration_seconds_bucket{le="0.1"} 240
http_request_duration_seconds_bucket{le="+Inf"} 300
http_request_duration_seconds_sum 31.7
http_request_duration_seconds_count 300
```

## Metric types

| Type | Behaviour | Query with | Example |
|------|-----------|------------|---------|
| Counter | only increases (resets on restart) | `rate`, `increase` | `http_requests_total` |
| Gauge | up & down | raw, `*_over_time` | `queue_length` |
| Histogram | `_bucket{le}`, `_sum`, `_count` | `histogram_quantile` | `http_request_duration_seconds` |
| Summary | `{quantile}`, `_sum`, `_count` (client-side) | read directly; not aggregatable | `rpc_duration_seconds` |
| Info (py) | gauge = 1 with labels | joins | `app_build_info{version}` |

Naming: `snake_case`, `<namespace>_<name>_<unit>`, base units (`_seconds`, `_bytes`), counters end with `_total`.

---

## PromQL

### Selectors & modifiers

```promql
http_requests_total{job="app", status="200"}
http_requests_total{status=~"5..", method!="GET"}
http_requests_total{endpoint!~"/health|/metrics"}
{__name__=~"node_cpu.*"}
http_requests_total[5m]                 # range vector
http_requests_total offset 1h
http_requests_total @ end()
```

### Functions

| Function | Use |
|----------|-----|
| `rate(c[5m])` | per-second avg rate of a counter (alerts, graphs) |
| `irate(c[5m])` | instant rate (last 2 samples) |
| `increase(c[1h])` | total increase in range |
| `delta(g[1h])` / `deriv(g[1h])` | gauge change / slope |
| `predict_linear(g[6h], 3600*24)` | forecast |
| `avg|min|max|sum|count|quantile_over_time(g[10m])` | gauge over time |
| `histogram_quantile(0.95, sum by (le) (rate(x_bucket[5m])))` | percentile |
| `absent(x)` / `absent_over_time(x[5m])` | series missing |
| `changes(g[1h])` / `resets(c[1h])` | count changes / resets |
| `label_replace(v, "dst", "$1", "src", "(.*):.*")` | rewrite label |
| `label_join(v, "dst", "-", "a", "b")` | join labels |
| `clamp_min / clamp_max / abs / round / ceil / floor` | math |
| `time()` / `timestamp(v)` | now / sample time |
| `vector(0)` / `scalar(v)` | type conversion |
| `sort / sort_desc` | ordering |

### Aggregation

```promql
sum(rate(http_requests_total[5m]))
sum by (endpoint, status) (rate(http_requests_total[5m]))
sum without (instance, pod) (rate(http_requests_total[5m]))
avg | min | max | count | stddev | group  by (x) (...)
topk(5, sum by (endpoint) (rate(http_requests_total[5m])))
bottomk(3, ...)
quantile(0.9, ...)
count_values("version", app_build_info)
```

### Operators & matching

```promql
a + b   a - b   a * b   a / b   a % b   a ^ b
x > 10            # filter
x > bool 10       # 0/1
a and b   a or b   a unless b
a / on(instance) b
a / ignoring(code) b
rate(http_requests_total[5m]) * on(instance) group_left(version) app_build_info
```

Subquery: `max_over_time(rate(x[5m])[1h:1m])`

### Rules of thumb

- `rate` first, then `sum` → `sum(rate(x[5m]))`, never `rate(sum(x)[5m])`
- range ≥ 4× scrape interval (Grafana: `$__rate_interval`)
- keep `le` when aggregating histogram buckets
- never graph raw counters

### Recipes

```promql
# RED
sum(rate(http_requests_total{job="app"}[5m]))
sum(rate(http_requests_total{job="app",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="app"}[5m]))
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{job="app"}[5m])))
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
# SLI: % under 300ms
sum(rate(http_request_duration_seconds_bucket{le="0.3"}[5m])) / sum(rate(http_request_duration_seconds_count[5m]))
# availability
avg_over_time(up{job="app"}[1h])
# uptime
time() - process_start_time_seconds
# node
100 - avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100
100 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100
predict_linear(node_filesystem_avail_bytes{mountpoint="/"}[6h], 24*3600) < 0
rate(node_network_receive_bytes_total[5m])
# containers / kubernetes
sum by (pod) (rate(container_cpu_usage_seconds_total{namespace="dev",container!=""}[5m]))
sum by (pod) (container_memory_working_set_bytes{namespace="dev",container!=""})
increase(kube_pod_container_status_restarts_total[1h]) > 0
kube_deployment_status_replicas_available < kube_deployment_spec_replicas
sum by (phase) (kube_pod_status_phase)
# blackbox
probe_success == 0
(probe_ssl_earliest_cert_expiry - time()) / 86400 < 14
```

---

## Python client (`prometheus_client`)

```bash
pip install prometheus-client
```

```python
from prometheus_client import Counter, Gauge, Histogram, Summary, Info, Enum
from prometheus_client import start_http_server, generate_latest, CONTENT_TYPE_LATEST, push_to_gateway, CollectorRegistry

REQS = Counter("app_requests_total", "Requests", ["method", "endpoint", "status"])
INPROG = Gauge("app_requests_in_progress", "In flight")
LAT = Histogram("app_request_duration_seconds", "Latency", ["endpoint"], buckets=(.05, .1, .25, .5, 1, 2.5))
SIZE = Summary("app_payload_bytes", "Payload size")
BUILD = Info("app_build", "Build info")
STATE = Enum("app_state", "State", states=["starting", "running", "stopped"])

REQS.labels("GET", "/", "200").inc()          # .inc(n)
INPROG.inc(); INPROG.dec(); INPROG.set(3); INPROG.set_to_current_time()
INPROG.set_function(lambda: len(queue))      # computed on scrape
LAT.labels(endpoint="/").observe(0.23)
SIZE.observe(512)
BUILD.info({"version": "1.0.0", "commit": "ab12cd3"})
STATE.state("running")

@LAT.labels(endpoint="/slow").time()           # decorator / context manager
def slow(): ...
@INPROG.track_inprogress()
def work(): ...
@Counter("app_failures_total", "Failures").count_exceptions()
def risky(): ...
with LAT.labels(endpoint="/db").time(): ...
```

Expose:

```python
start_http_server(8000)                                       # scripts / workers

@app.get("/metrics")                                          # Flask
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}

from werkzeug.middleware.dispatcher import DispatcherMiddleware
from prometheus_client import make_wsgi_app, make_asgi_app
app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {"/metrics": make_wsgi_app()})   # Flask (WSGI)
fastapi_app.mount("/metrics", make_asgi_app())                                       # FastAPI (ASGI)
```

Flask middleware (bounded labels):

```python
@app.before_request
def _start(): g.t = time.perf_counter(); INPROG.inc()

@app.after_request
def _record(resp):
    ep = str(request.url_rule) if request.url_rule else "unmatched"
    LAT.labels(ep).observe(time.perf_counter() - g.t)
    REQS.labels(request.method, ep, resp.status_code).inc()
    INPROG.dec()
    return resp
```

Custom collector (exporter):

```python
from prometheus_client.core import GaugeMetricFamily, CounterMetricFamily, REGISTRY
class MyCollector:
    def collect(self):                       # called on every scrape
        g = GaugeMetricFamily("thing_value", "Help", labels=["name"])
        g.add_metric(["a"], 42)
        yield g
REGISTRY.register(MyCollector())
```

Pushgateway:

```python
reg = CollectorRegistry()
Gauge("job_last_success_unixtime", "Last success", registry=reg).set_to_current_time()
push_to_gateway("pushgateway:9091", job="backup", grouping_key={"db": "orders"}, registry=reg)
```

Gunicorn: `PROMETHEUS_MULTIPROC_DIR=/tmp/prom` + `multiprocess.MultiProcessCollector(registry)`.
Auto instrumentation: `prometheus-flask-exporter`, `prometheus-fastapi-instrumentator`.

---

## Exporters

| Exporter | Image | Key metrics |
|----------|-------|-------------|
| node | `quay.io/prometheus/node-exporter` | `node_cpu_seconds_total`, `node_memory_*`, `node_filesystem_*`, `node_load1` |
| blackbox | `prom/blackbox-exporter` | `probe_success`, `probe_duration_seconds`, `probe_http_status_code`, `probe_ssl_earliest_cert_expiry` |
| cAdvisor | `gcr.io/cadvisor/cadvisor` | `container_cpu_usage_seconds_total`, `container_memory_working_set_bytes` |
| kube-state-metrics | (k8s) | `kube_pod_status_phase`, `kube_deployment_*`, `kube_pod_container_status_restarts_total` |
| redis | `oliver006/redis_exporter` | `redis_up`, `redis_connected_clients` |
| postgres | `prometheuscommunity/postgres-exporter` | `pg_up`, `pg_stat_database_*` |
| mysql | `prom/mysqld-exporter` | `mysql_up` |
| nginx | `nginx/nginx-prometheus-exporter` | `nginx_connections_active` |
| json | `prometheuscommunity/json-exporter` | any JSON API |
| pushgateway | `prom/pushgateway` | pushed metrics, `push_time_seconds` |

node_exporter: `docker run -d --net host --pid host -v /:/host:ro,rslave quay.io/prometheus/node-exporter --path.rootfs=/host` · textfile collector: `--collector.textfile.directory=/var/lib/node_exporter`.

Blackbox scrape job (multi-target pattern):

```yaml
- job_name: blackbox-http
  metrics_path: /probe
  params: { module: [http_2xx] }
  static_configs: [{ targets: ["https://example.com", "http://app:5000/health"] }]
  relabel_configs:
    - { source_labels: [__address__], target_label: __param_target }
    - { source_labels: [__param_target], target_label: instance }
    - { target_label: __address__, replacement: blackbox:9115 }
```

Pushgateway job: `honor_labels: true`. Push from bash: `echo "x 1" | curl --data-binary @- http://pgw:9091/metrics/job/myjob/instance/i1`

---

## Rules & alerting

```yaml
groups:
  - name: app
    interval: 30s
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))
      - alert: HighErrorRate
        expr: |
          sum by (job) (rate(http_requests_total{status=~"5.."}[5m]))
            / sum by (job) (rate(http_requests_total[5m])) > 0.05
        for: 5m
        keep_firing_for: 2m
        labels: { severity: critical, team: shop }
        annotations:
          summary: "High error rate on {{ $labels.job }}"
          description: "{{ $value | humanizePercentage }} of requests fail"
          runbook_url: https://wiki/runbooks/high-error-rate
```

Template helpers: `$labels.x`, `$value`, `humanize`, `humanizePercentage`, `humanizeDuration`, `humanize1024`.
States: inactive → pending (`for`) → firing → resolved.

Rule unit test (`promtool test rules tests.yml`):

```yaml
rule_files: [alerts.yml]
evaluation_interval: 1m
tests:
  - interval: 1m
    input_series:
      - { series: 'up{job="app",instance="a"}', values: "0 0 0 0 0" }
    alert_rule_test:
      - eval_time: 5m
        alertname: InstanceDown
        exp_alerts: [{ exp_labels: { severity: critical, job: app, instance: a } }]
```

### Alertmanager

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: smtp.gmail.com:587
  smtp_from: alerts@example.com
route:
  receiver: default
  group_by: [alertname, job]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - matchers: ['severity="critical"']
      receiver: pager
      continue: true
    - matchers: ['team=~"shop|cart"']
      receiver: slack-shop
      mute_time_intervals: [nights]
receivers:
  - name: default
    webhook_configs: [{ url: http://hook:8080/, send_resolved: true }]
  - name: slack-shop
    slack_configs:
      - api_url: https://hooks.slack.com/services/XXX
        channel: "#shop-alerts"
        send_resolved: true
        title: '[{{ .Status | toUpper }}] {{ .CommonLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ "\n" }}{{ end }}'
  - name: pager
    email_configs: [{ to: oncall@example.com }]
inhibit_rules:
  - source_matchers: ['severity="critical"']
    target_matchers: ['severity="warning"']
    equal: [job]
time_intervals:
  - name: nights
    time_intervals: [{ times: [{ start_time: "22:00", end_time: "07:00" }] }]
```

```bash
amtool check-config alertmanager.yml
amtool --alertmanager.url=http://localhost:9093 alert query
amtool --alertmanager.url=http://localhost:9093 silence add alertname=HighLatency --duration=2h --comment="deploy"
amtool --alertmanager.url=http://localhost:9093 silence query
amtool --alertmanager.url=http://localhost:9093 silence expire <id>
```

---

## Kubernetes (kube-prometheus-stack)

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install kps prometheus-community/kube-prometheus-stack -n monitoring --create-namespace -f values.yaml
kubectl -n monitoring port-forward svc/kps-kube-prometheus-stack-prometheus 9090
kubectl -n monitoring port-forward svc/kps-grafana 3000:80
kubectl -n monitoring get secret kps-grafana -o jsonpath='{.data.admin-password}' | base64 -d
kubectl get prometheus -n monitoring -o yaml | grep -A3 serviceMonitorSelector
kubectl get servicemonitors,podmonitors,prometheusrules -A
```

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: app
  namespace: dev
  labels: { release: kps }              # must match serviceMonitorSelector
spec:
  selector: { matchLabels: { app: app } }
  namespaceSelector: { matchNames: [dev] }
  endpoints:
    - { port: http, path: /metrics, interval: 15s }   # port = Service port NAME
---
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata: { name: worker, namespace: dev, labels: { release: kps } }
spec:
  selector: { matchLabels: { app: worker } }
  podMetricsEndpoints: [{ port: metrics }]
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata: { name: app-rules, namespace: dev, labels: { release: kps } }
spec:
  groups:
    - name: app
      rules:
        - alert: PodRestarting
          expr: increase(kube_pod_container_status_restarts_total{namespace="dev"}[10m]) > 2
          for: 1m
          labels: { severity: warning }
```

values.yaml snippet to select all monitors regardless of labels:

```yaml
prometheus:
  prometheusSpec:
    serviceMonitorSelectorNilUsesHelmValues: false
    podMonitorSelectorNilUsesHelmValues: false
    ruleSelectorNilUsesHelmValues: false
    retention: 7d
grafana:
  adminPassword: admin
  service: { type: NodePort }
```

---

## Grafana

```bash
docker run -d --name grafana -p 3000:3000 -v grafana-data:/var/lib/grafana grafana/grafana:11.2.0   # admin/admin
```

| Task | Where / how |
|------|-------------|
| Add data source | Connections → Data sources → Prometheus → `http://prometheus:9090` (not localhost in Docker) |
| Explore | Explore tab - ad-hoc PromQL / LogQL |
| Import dashboard | Dashboards → New → Import → ID (1860 Node Exporter Full, 7587 Blackbox, 3662 Prometheus) |
| Export | Share → Export → JSON (external) |
| Variables | Dashboard settings → Variables |
| Alerting | Alerting → rules / contact points / notification policies / silences |
| Annotations | `POST /api/annotations` or query-based |

### Panel types

| Panel | Best for |
|-------|----------|
| Time series | trends |
| Stat | single value + thresholds |
| Gauge / Bar gauge | % of a limit |
| Table | lists, instant queries (Format: Table) |
| Heatmap | histogram buckets over time (`sum by (le) (increase(x_bucket[$__rate_interval]))`, format Heatmap) |
| Logs | Loki |
| Text | markdown, runbook links |

Panel options: **unit** (seconds, bytes(IEC), percent (0-100), percentunit (0-1), reqps), decimals, min/max, thresholds, legend `{{endpoint}}`, overrides (color per series), transformations, repeat by variable.

### Variables

| Variable | Query |
|----------|-------|
| `$job` | `label_values(up, job)` |
| `$instance` | `label_values(up{job="$job"}, instance)` (multi + All, custom all value `.*`) |
| `$endpoint` | `label_values(http_requests_total{job="$job"}, endpoint)` |
| `$namespace` | `label_values(kube_pod_info, namespace)` |
| regex filter | `query_result(...)` + Regex field |

Built-ins: `$__rate_interval` · `$__interval` · `$__range` · `$__from` / `$__to` · `$__dashboard`.

Usage: `sum by (endpoint) (rate(http_requests_total{job="$job", instance=~"$instance"}[$__rate_interval]))`

### Provisioning

```yaml
# /etc/grafana/provisioning/datasources/ds.yml
apiVersion: 1
datasources:
  - { name: Prometheus, type: prometheus, uid: prometheus, url: http://prometheus:9090, isDefault: true }
  - { name: Loki, type: loki, uid: loki, url: http://loki:3100 }
---
# /etc/grafana/provisioning/dashboards/dash.yml
apiVersion: 1
providers:
  - { name: default, folder: Course, type: file, options: { path: /var/lib/grafana/dashboards } }
```

Kubernetes: ConfigMap with label `grafana_dashboard: "1"` → auto-loaded by the sidecar.

Env config: `GF_SECURITY_ADMIN_PASSWORD`, `GF_USERS_ALLOW_SIGN_UP=false`, `GF_AUTH_ANONYMOUS_ENABLED=true`, `GF_SERVER_ROOT_URL`.

### API

```bash
curl -u admin:admin localhost:3000/api/health
curl -u admin:admin localhost:3000/api/search?query=shop
curl -u admin:admin localhost:3000/api/datasources
curl -u admin:admin localhost:3000/api/dashboards/uid/<uid>
curl -u admin:admin -H 'Content-Type: application/json' -X POST localhost:3000/api/annotations \
  -d '{"tags":["deploy"],"text":"v1.2.0"}'
curl -H "Authorization: Bearer $SA_TOKEN" localhost:3000/api/folders
```

---

## Logs & traces (quick)

```logql
{namespace="dev", app="shop"} |= "ERROR"
{app="shop"} | json | status >= 500 | line_format "{{.method}} {{.path}}"
sum by (level) (rate({app="shop"} | json [5m]))
```

```bash
OTEL_SERVICE_NAME=shop OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317 opentelemetry-instrument python app.py
```

LGTM = Loki · Grafana · Tempo · Mimir. Correlate via exemplars (metric → trace) and `trace_id` in logs.

---

## Best practices

- [ ] Instrument RED for every service + business metrics
- [ ] Bounded labels only (route template, status code) - no IDs, emails, raw URLs
- [ ] Base units & naming conventions; counters end with `_total`
- [ ] Histogram buckets around your SLO
- [ ] Recording rules for heavy/common queries
- [ ] Alert on symptoms with `for:`, every alert has severity + runbook
- [ ] Group, inhibit and route in Alertmanager; silence during maintenance
- [ ] Dashboards as code (provisioning / ConfigMaps), correct units, `$__rate_interval`
- [ ] Retention + remote_write for long-term storage, HA pairs for Prometheus
- [ ] Monitor the monitoring (`up{job="prometheus"}`, Alertmanager, dead man's switch / Watchdog alert)

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Target DOWN `connection refused` | host/port, container network name (not localhost), app listening on 0.0.0.0 |
| Target DOWN `404` | wrong `metrics_path` |
| `context deadline exceeded` | slow exporter → raise `scrape_timeout` / cache |
| `Empty query result` | metric name/labels typo, range too short for `rate`, time range |
| Graph has gaps | range < 2× scrape interval → `$__rate_interval` |
| p95 looks wrong | forgot `sum by (le)`, buckets too coarse |
| Series explosion / OOM | high-cardinality label → TSDB Status page, drop with `metric_relabel_configs` |
| ServiceMonitor ignored | `release` label, port **name**, namespaceSelector, Service selector |
| Pushgateway labels overwritten | `honor_labels: true` |
| Alert never fires | rule loaded? (Status → Rules), `for` too long, expression returns nothing |
| No notification | Alertmanager URL in prometheus.yml, route matchers, inhibition, silence, `amtool check-config` |
| Grafana "Bad Gateway" on data source | URL from Grafana's point of view (`http://prometheus:9090`) |
