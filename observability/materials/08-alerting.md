# Recording Rules, Alerting Rules & Alertmanager

## Recording rules - precompute expensive queries

```yaml
# rules/recording.yml
groups:
  - name: flask-recording
    interval: 30s
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))
      - record: job:http_errors:ratio5m
        expr: |
          sum by (job) (rate(http_requests_total{status=~"5.."}[5m]))
            /
          sum by (job) (rate(http_requests_total[5m]))
```

Naming convention: `level:metric:operations`.

---

## Alerting rules

```yaml
# rules/alerts.yml
groups:
  - name: flask-alerts
    rules:
      - alert: TargetDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.job }} on {{ $labels.instance }} is down"
          description: "No successful scrape for more than 1 minute."

      - alert: HighErrorRate
        expr: job:http_errors:ratio5m > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High 5xx rate on {{ $labels.job }}"
          description: "Error ratio is {{ $value | humanizePercentage }}"
          runbook_url: https://wiki.example.com/runbooks/high-error-rate

      - alert: HighLatencyP95
        expr: histogram_quantile(0.95, sum by (le) (rate(app_request_duration_seconds_bucket[5m]))) > 0.5
        for: 10m
        labels:
          severity: warning
```

### Alert states

```
inactive ──expr true──▶ pending (waiting `for`) ──still true after `for`──▶ firing ──▶ Alertmanager
```

```bash
promtool check rules rules/*.yml
promtool test rules tests.yml           # unit tests for rules
```

---

## Alertmanager

```
Prometheus ──alerts──▶ Alertmanager: dedupe → group → inhibit/silence → route → receivers (Slack, email, PagerDuty, webhook, Teams)
```

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  receiver: default
  group_by: [alertname, job]
  group_wait: 30s          # wait to batch the first notification
  group_interval: 5m       # wait before sending new alerts for the same group
  repeat_interval: 4h      # re-send if still firing
  routes:
    - matchers: [severity="critical"]
      receiver: pagerduty
      continue: true
    - matchers: [team="shop"]
      receiver: slack-shop

receivers:
  - name: default
    webhook_configs:
      - url: http://webhook-logger:8080/
  - name: slack-shop
    slack_configs:
      - api_url: https://hooks.slack.com/services/XXX
        channel: "#shop-alerts"
        send_resolved: true
        title: '{{ .CommonAnnotations.summary }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ "\n" }}{{ end }}'
  - name: pagerduty
    pagerduty_configs:
      - routing_key: XXX

inhibit_rules:
  - source_matchers: [severity="critical"]
    target_matchers: [severity="warning"]
    equal: [job]
```

| Feature | Meaning |
|---------|---------|
| **Grouping** | many alerts → one notification |
| **Inhibition** | suppress warnings while a related critical fires |
| **Silences** | mute alerts temporarily (maintenance) via UI / `amtool` |
| **Routing** | tree of matchers → receivers |

```bash
amtool alert query --alertmanager.url=http://localhost:9093
amtool silence add alertname=HighLatencyP95 --duration=2h --comment="deploy"
```

---

## Good alerting

- Alert on **symptoms** (users affected: errors, latency, SLO burn), not causes (CPU 80%)
- Every alert must be **actionable** and have a runbook
- Use `for:` to avoid flapping
- Severity: `critical` = page someone now, `warning` = ticket / next business day
- SLO burn-rate alerts (multi-window) are the gold standard
