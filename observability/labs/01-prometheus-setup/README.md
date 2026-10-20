# Lab 01: Prometheus Setup & Configuration

## Objective

Run Prometheus with Docker, scrape multiple targets and understand the UI, labels and configuration.

## Prerequisites

- Read [02-prometheus-architecture.md](../../materials/02-prometheus-architecture.md)
- Reference: [class-code/01-prometheus-basics](../../class-code/01-prometheus-basics), [prometheus-lab-1](../../prometheus-lab-1)

## Exercise

### Step 1: Prometheus alone
1. Run `prom/prometheus` with a `prometheus.yml` that scrapes only itself.
2. Open `/targets`, `/config`, `/tsdb-status`. How many series exist?
3. Query `up`, `prometheus_tsdb_head_series`, `scrape_duration_seconds`.

### Step 2: Docker Compose stack
Create `compose.yaml` with:
- `prometheus` (config + named volume for data, 10 day retention, lifecycle API enabled)
- `node-exporter`
- the flask app from [prometheus-lab-1/flask](../../prometheus-lab-1/flask) (write a Dockerfile)

### Step 3: Scrape configuration
1. Job `flask` with `scrape_interval: 5s` and static labels `env=dev`, `team=<your-name>`.
2. Job `node`.
3. Validate with `promtool check config` and reload with `curl -X POST /-/reload` (no restart).

### Step 4: Remote node
1. Launch an EC2 instance (or a second VM), install node_exporter as a systemd service.
2. Open port 9100 only to your Prometheus IP (security group).
3. Add it as a target with label `location=aws`.

### Step 5: Break things
1. Stop the flask container. What does `/targets` show? What is `up{job="flask"}`?
2. Add a target with a wrong `metrics_path`. What error is shown?
3. Set `scrape_timeout` larger than `scrape_interval`. What happens?

### Step 6: Exposition format
`curl` the flask `/metrics` endpoint and explain each part: `# HELP`, `# TYPE`, labels, value.

## Challenge Exercise

1. Use `file_sd_configs` and add/remove a target by editing a JSON file (no reload needed).
2. Use `metric_relabel_configs` to drop all `python_gc_*` metrics. Verify the series count went down.
3. Calculate how much disk Prometheus needs: `series × samples per day × ~1.5 bytes`.

## Deliverables
`compose.yaml`, `prometheus.yml`, screenshots of targets, answers.
