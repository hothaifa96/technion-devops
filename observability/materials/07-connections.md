# Connections: Service Discovery, Relabeling, Pushgateway, Federation, Remote Write & Kubernetes

How Prometheus **finds** targets and **connects** to other systems.

---

## Service Discovery (SD)

| SD | Config key | Use |
|----|-----------|-----|
| Static | `static_configs` | fixed hosts |
| File | `file_sd_configs` | JSON/YAML files updated by scripts/Ansible |
| DNS | `dns_sd_configs` | SRV / A records |
| Kubernetes | `kubernetes_sd_configs` | roles: node, pod, service, endpoints, endpointslice, ingress |
| AWS EC2 | `ec2_sd_configs` | instances by tags |
| Consul, Docker, Azure, GCE ... | | |

### File SD

```yaml
- job_name: apps
  file_sd_configs:
    - files: ["/etc/prometheus/targets/*.json"]
      refresh_interval: 1m
```

```json
[{ "targets": ["10.0.1.5:5000", "10.0.1.6:5000"], "labels": { "env": "prod", "team": "shop" } }]
```

### EC2 SD

```yaml
- job_name: ec2-nodes
  ec2_sd_configs:
    - region: us-east-1
      port: 9100
      filters:
        - name: tag:monitoring
          values: ["true"]
  relabel_configs:
    - source_labels: [__meta_ec2_tag_Name]
      target_label: name
    - source_labels: [__meta_ec2_private_ip]
      target_label: __address__
      replacement: "$1:9100"
```

---

## Relabeling

Rewrite labels **before** scraping (`relabel_configs`) or **after** scraping, per sample (`metric_relabel_configs`).

| Action | Effect |
|--------|--------|
| `replace` (default) | set `target_label` from regex on `source_labels` |
| `keep` / `drop` | keep/drop targets (or samples) matching regex |
| `labelmap` | copy labels matching regex |
| `labeldrop` / `labelkeep` | remove labels |
| `hashmod` | sharding |

Special labels: `__address__`, `__metrics_path__`, `__scheme__`, `__param_<name>`, `__meta_*` (from SD, dropped after relabeling).

```yaml
relabel_configs:
  # only pods annotated prometheus.io/scrape=true
  - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
    action: keep
    regex: "true"
  # custom path from annotation
  - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
    target_label: __metrics_path__
    regex: (.+)
  # copy k8s labels
  - action: labelmap
    regex: __meta_kubernetes_pod_label_(.+)
  - source_labels: [__meta_kubernetes_namespace]
    target_label: namespace
metric_relabel_configs:
  # drop expensive metrics
  - source_labels: [__name__]
    regex: go_gc_.*
    action: drop
```

---

## Pushgateway

For **short-lived batch jobs** that finish before a scrape.

```
cron job ──push──▶ Pushgateway :9091 ◀──scrape── Prometheus (honor_labels: true)
```

```bash
echo "backup_duration_seconds 42" | curl --data-binary @- http://pushgateway:9091/metrics/job/backup/instance/db1
curl -X DELETE http://pushgateway:9091/metrics/job/backup/instance/db1
```

```yaml
- job_name: pushgateway
  honor_labels: true
  static_configs:
    - targets: ["pushgateway:9091"]
```

> Not for long-running services. Metrics stay forever until deleted; push a `*_last_success_timestamp_seconds`.

---

## Federation

A global Prometheus scrapes selected series from other Prometheus servers:

```yaml
- job_name: federate
  honor_labels: true
  metrics_path: /federate
  params:
    "match[]":
      - '{job="flask-app"}'
      - '{__name__=~"job:.*"}'          # recording rules
  static_configs:
    - targets: ["prometheus-eu:9090", "prometheus-us:9090"]
```

## Remote write / read (long-term storage)

```yaml
remote_write:
  - url: https://aps-workspaces.us-east-1.amazonaws.com/workspaces/ws-xxx/api/v1/remote_write
    sigv4: { region: us-east-1 }
  - url: http://mimir:9009/api/v1/push
```

Backends: Thanos, Grafana Mimir, Cortex, VictoriaMetrics, AWS Managed Prometheus, Grafana Cloud.

---

## Prometheus on Kubernetes

### kube-prometheus-stack (Prometheus Operator)

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install kps prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

Installs: Prometheus Operator, Prometheus, Alertmanager, Grafana (+ dashboards), node-exporter (DaemonSet), kube-state-metrics, default alert rules.

### CRDs

| CRD | Purpose |
|-----|---------|
| `Prometheus` | Prometheus server deployment |
| `ServiceMonitor` | scrape **Services** matching a label selector |
| `PodMonitor` | scrape **Pods** directly |
| `PrometheusRule` | recording & alert rules |
| `Alertmanager`, `AlertmanagerConfig` | alerting config |
| `Probe` | blackbox probes |

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: flask-app
  namespace: dev
  labels:
    release: kps            # must match the Prometheus serviceMonitorSelector!
spec:
  selector:
    matchLabels:
      app: flask-app
  namespaceSelector:
    matchNames: [dev]
  endpoints:
    - port: http            # NAME of the service port
      path: /metrics
      interval: 15s
```

Troubleshooting checklist: ServiceMonitor label matches `release`? Service selector matches pods? Port **name** correct? Target visible in Status → Targets?

See [../prometheus-kubernetes](../prometheus-kubernetes) for a working example.
