# Demo 03 - Writing a custom exporter

```bash
docker compose up -d --build
curl -s localhost:9200/metrics | grep github_
open http://localhost:9090
```

```promql
github_repo_stars
topk(2, github_repo_stars)
github_repo_up == 0
github_repo_open_issues / github_repo_stars
```

Key points:
- `collect()` runs on **every scrape** → always fresh values (cache protects the API)
- `GaugeMetricFamily` builds metrics per scrape instead of global state
- `github_repo_up` exposes the health of the backend system
- Regular `Counter` (`github_exporter_api_errors_total`) can live next to custom collectors
