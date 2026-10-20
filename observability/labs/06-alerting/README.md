# Lab 06: Alerting with Prometheus & Alertmanager

## Objective

Write meaningful alerts, route them to the right people and test them.

## Prerequisites

- Read [08-alerting.md](../../materials/08-alerting.md)
- Reference: [class-code/06-alerting](../../class-code/06-alerting)

## Exercise

### Step 1: Recording rules
Create recording rules for: RPS per job, error ratio per job, p95 latency per endpoint. Follow the `level:metric:operation` naming.

### Step 2: Alert rules
| Alert | Condition | for | severity |
|-------|-----------|-----|----------|
| `InstanceDown` | target not scraped | 1m | critical |
| `HighErrorRate` | error ratio > 5% | 2m | critical |
| `HighLatency` | p95 > 800ms | 5m | warning |
| `HostHighCPU` | CPU > 85% | 5m | warning |
| `DiskWillFillIn4h` | `predict_linear` < 0 | 10m | warning |
| `CertificateExpiringSoon` | blackbox cert < 14 days | 1h | warning |

Every alert needs `summary`, `description` (with `{{ $value }}` and `{{ $labels }}`) and `runbook_url`.

### Step 3: Validate & unit test
1. `promtool check rules`.
2. Write a `promtool test rules` file that tests `InstanceDown` and `HighErrorRate` with fake series.

### Step 4: Alertmanager routing
1. Default receiver: a webhook (webhook.site or the echo container).
2. `severity=critical` → Slack channel `#oncall` (create a free Slack workspace + incoming webhook) **and** email (continue: true).
3. `team=db` → a different receiver.
4. Group by `alertname, job`; `group_wait 10s`, `repeat_interval 1h`.
5. Inhibit warnings when `InstanceDown` fires for the same job.

### Step 5: Trigger & observe
1. Stop the app → watch the alert go inactive → pending → firing → notification → resolved.
2. Generate errors → `HighErrorRate`.
3. Create a silence for 15 minutes with `amtool` and verify no notification is sent.

### Step 6: Templates
Write a custom Slack template showing: status, alertname, severity, summary, link to Grafana and the runbook.

## Challenge Exercise

1. Implement a multi-window **SLO burn-rate** alert for a 99.5% availability SLO (1h & 5m windows).
2. Move the alerts into Grafana Alerting and compare the experience.

## Deliverables
Rules, tests, `alertmanager.yml`, screenshots of notifications.
