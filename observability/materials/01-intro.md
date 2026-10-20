# Observability Introduction

## Monitoring vs Observability

- **Monitoring** - watching known failure modes ("is CPU > 90%?")
- **Observability** - ability to ask *new* questions about the system from its outputs ("why are checkout requests from Android slow since 14:00?")

---

## The three pillars

| Pillar | What | Example | Tools |
|--------|------|---------|-------|
| **Metrics** | numeric time series, cheap, aggregatable | `http_requests_total{status="500"} 42` | Prometheus, Grafana, Datadog, CloudWatch |
| **Logs** | discrete timestamped events with detail | `ERROR order 123 failed: timeout` | Loki, ELK/OpenSearch, CloudWatch Logs |
| **Traces** | the path of one request across services | span tree with durations | Tempo, Jaeger, Zipkin, X-Ray |

(+ **profiles** and **events** are often called the 4th/5th pillars)

```
 alert fires (metric)  ─▶  which pod/endpoint? (metric labels) ─▶  what happened? (logs)  ─▶  where is the latency? (trace)
```

---

## What to measure

### The 4 Golden Signals (Google SRE)

| Signal | Question | Example metric |
|--------|----------|----------------|
| **Latency** | how long do requests take? | p95 of `http_request_duration_seconds` |
| **Traffic** | how much demand? | requests per second |
| **Errors** | how many fail? | rate of 5xx / total |
| **Saturation** | how full is the system? | CPU, memory, queue length |

### RED method (for services)
**R**ate, **E**rrors, **D**uration

### USE method (for resources)
**U**tilization, **S**aturation, **E**rrors - for CPU, memory, disk, network

---

## SLI / SLO / SLA

| Term | Meaning | Example |
|------|---------|---------|
| **SLI** | indicator - a measured value | % of requests < 300ms |
| **SLO** | objective - internal target for an SLI | 99.9% of requests < 300ms over 30 days |
| **SLA** | agreement - contract with consequences | 99.5% availability or refund |
| **Error budget** | 100% − SLO | 0.1% ≈ 43 minutes / 30 days |

---

## Push vs Pull

| | Pull (Prometheus) | Push (StatsD, CloudWatch, OTLP) |
|---|---|---|
| Who initiates | server scrapes targets | app sends data |
| Target health | `up` metric for free | need heartbeats |
| Short-lived jobs | needs Pushgateway | natural |
| Firewalls | server must reach targets | targets must reach server |

---

## The stack in this course

```
 Flask app (/metrics) ─┐
 node-exporter ────────┤◀── scrape ── Prometheus ──▶ Alertmanager ──▶ Slack / email
 blackbox-exporter ────┤                  │
 kube-state-metrics ───┘                  ▼
                                       Grafana (dashboards, alerts)
```
