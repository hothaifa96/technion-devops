# Lab 04: Exporters - Use Them & Build One

## Objective

Monitor third-party systems with existing exporters and write your own exporter in Python.

## Prerequisites

- Read [06-exporters.md](../../materials/06-exporters.md)
- Reference: [class-code/03-custom-exporter](../../class-code/03-custom-exporter), [class-code/04-blackbox](../../class-code/04-blackbox)

## Part A - Existing exporters
Create a compose stack with:
1. `redis` + `oliver006/redis_exporter` → query `redis_connected_clients`, `redis_memory_used_bytes`, ops/sec.
2. `postgres` + `prometheuscommunity/postgres-exporter` → active connections, database size.
3. `nginx` (with `stub_status`) + `nginx/nginx-prometheus-exporter` → active connections, requests/sec.
4. `gcr.io/cadvisor/cadvisor` → CPU and memory **per container** of the whole stack.

For each: which port? which metrics are most useful? write 2 PromQL queries.

## Part B - Blackbox
1. Probe 5 URLs (your app, a public site, a non-existing domain, an HTTPS site with a certificate, a TCP port of postgres).
2. Use the relabeling trick so `instance` shows the URL.
3. Queries: availability % over 1h, slowest site, days until certificate expiry.

## Part C - Custom exporter
Write an exporter in Python that monitors something real. Choose one:
- **Weather** - temperature/humidity per city from open-meteo.com (no API key)
- **Crypto** - prices from the CoinGecko API
- **Docker** - number of running/stopped containers and images via the Docker SDK
- **Your own app's DB** - number of users / orders from SQLite/Postgres

Requirements:
1. Custom collector class with `collect()` and `*MetricFamily`
2. At least 1 gauge with labels, 1 counter, and an `*_up` metric
3. Configuration from env vars (port, targets, interval)
4. Caching to avoid hammering the API
5. Dockerfile (non-root) + scrape config
6. A README describing the metrics

## Challenge Exercise

1. Use node_exporter's **textfile collector** with a cron script that writes `backup_last_run_timestamp_seconds`.
2. Use `json_exporter` to scrape a JSON API without writing code and compare with your Python exporter.

## Deliverables
Compose stack, exporter code, queries.
