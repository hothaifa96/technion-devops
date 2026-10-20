# Demo 07 - Grafana: provisioning, dashboards, variables

```bash
docker compose up -d --build
open http://localhost:3000        # admin / admin
```

Everything is **provisioned as code**:

```
grafana/
├── provisioning/datasources/datasource.yml   # Prometheus data source (uid: prometheus)
├── provisioning/dashboards/dashboards.yml    # load JSON dashboards from a folder
└── dashboards/shop-overview.json             # RED + business + host dashboard
```

Live in class:
1. Dashboards → DevOps Course → **Shop - RED overview**
2. Change the `endpoint` variable (multi-select, All)
3. Edit a panel: query, legend `{{endpoint}}`, unit, thresholds, `$__rate_interval`
4. Add a new panel: `topk(3, sum by (endpoint) (rate(shop_http_requests_total[$__rate_interval])))`
5. Import community dashboard **1860** (Node Exporter Full)
6. Explore tab → ad-hoc PromQL
7. Alerting → create an alert rule on the error ratio → contact point webhook
8. Share → Export JSON → commit to Git

```bash
# Grafana HTTP API
curl -s -u admin:admin localhost:3000/api/search | python3 -m json.tool
curl -s -u admin:admin localhost:3000/api/datasources | python3 -m json.tool
docker compose down -v
```
