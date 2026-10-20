# Observability - Prometheus & Grafana

```
observability/
├── materials/                # theory
├── class-code/               # demos (docker compose stacks + python apps)
├── labs/                     # homework labs
├── prometheus-lab-1/         # (existing) first flask + prometheus lab
├── prometheus-kubernetes/    # (existing) flask app + kube-prometheus-stack + ServiceMonitor
└── traffic-gen/              # (existing) CronJob traffic generator
```

| # | Topic | Material | Class Code | Lab |
|---|-------|----------|------------|-----|
| 01 | Observability intro: metrics, logs, traces, golden signals | [01](materials/01-intro.md) | - | - |
| 02 | Prometheus architecture & configuration | [02](materials/02-prometheus-architecture.md) | [01-prometheus-basics](class-code/01-prometheus-basics) | [01-prometheus-setup](labs/01-prometheus-setup) |
| 03 | Metric types: counter, gauge, histogram, summary | [03](materials/03-metric-types.md) | [02-python-client](class-code/02-python-client) | [02-python-instrumentation](labs/02-python-instrumentation) |
| 04 | Python client library (prometheus_client) | [04](materials/04-python-client.md) | [02-python-client](class-code/02-python-client) | [02-python-instrumentation](labs/02-python-instrumentation) |
| 05 | PromQL | [05](materials/05-promql.md) | [01-prometheus-basics](class-code/01-prometheus-basics) | [03-promql](labs/03-promql) |
| 06 | Exporters (node, blackbox, cAdvisor, custom) | [06](materials/06-exporters.md) | [03-custom-exporter](class-code/03-custom-exporter), [04-blackbox](class-code/04-blackbox) | [04-exporters](labs/04-exporters) |
| 07 | Connections: service discovery, relabeling, pushgateway, federation, remote write, Kubernetes | [07](materials/07-connections.md) | [05-pushgateway](class-code/05-pushgateway), [prometheus-kubernetes](prometheus-kubernetes) | [05-kubernetes-monitoring](labs/05-kubernetes-monitoring) |
| 08 | Recording rules, alerting & Alertmanager | [08](materials/08-alerting.md) | [06-alerting](class-code/06-alerting) | [06-alerting](labs/06-alerting) |
| 09 | Grafana: data sources, dashboards, variables, provisioning, alerting | [09](materials/09-grafana.md) | [07-grafana](class-code/07-grafana) | [07-grafana-dashboards](labs/07-grafana-dashboards) |
| 10 | Logs & traces (Loki, Tempo, OpenTelemetry) overview | [10](materials/10-logs-traces.md) | - | - |

Cheatsheets: [full observability cheat sheet](materials/cheatsheet.md), [PromQL quick table](materials/promql-cheatsheet.md)
