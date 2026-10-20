# Logs & Traces Overview (Loki, Tempo, OpenTelemetry)

## Logs with Loki

"Like Prometheus, but for logs" - indexes only **labels**, stores log lines compressed (cheap).

```
app stdout ─▶ Promtail / Grafana Alloy / Fluent Bit (agent on each node) ─▶ Loki ─▶ Grafana (LogQL)
```

### LogQL

```logql
{namespace="dev", app="flask-app"}                          # stream selector
{app="flask-app"} |= "ERROR"                                # line contains
{app="flask-app"} |~ "timeout|refused"                      # regex
{app="flask-app"} | json | status >= 500                    # parse JSON + filter
sum by (level) (rate({app="flask-app"} | json [5m]))        # metrics from logs
```

Best practice: log in **JSON** with `level`, `msg`, `trace_id`.

---

## Traces with OpenTelemetry + Tempo/Jaeger

- **Trace** - one request end-to-end, a tree of **spans**
- **Span** - one operation (HTTP handler, DB query) with start, duration, attributes
- **Context propagation** - `traceparent` header passes the trace id between services

```
GET /checkout  ───────────────────────────── 420ms
  ├─ auth-service /verify  ──── 30ms
  ├─ cart-service /items   ────────── 80ms
  │    └─ redis GET        ── 3ms
  └─ payment-service /pay  ──────────────────── 290ms   ← bottleneck
```

### OpenTelemetry (OTel)

Vendor-neutral standard + SDKs + **Collector** for metrics, logs and traces.

```bash
pip install opentelemetry-distro opentelemetry-exporter-otlp
opentelemetry-bootstrap -a install
OTEL_SERVICE_NAME=flask-app OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317 \
  opentelemetry-instrument python app.py          # zero-code auto instrumentation
```

```
apps ──OTLP──▶ OTel Collector ──▶ Prometheus (metrics) / Loki (logs) / Tempo (traces)
```

---

## Correlation in Grafana

- **Exemplars**: a histogram sample links to a trace id → jump from a latency spike to the slow trace
- **Derived fields**: `trace_id` in a log line links to Tempo
- **Trace to logs / metrics**: from a span to the pod's logs

## LGTM stack

**L**oki (logs) · **G**rafana (UI) · **T**empo (traces) · **M**imir (metrics long-term)
