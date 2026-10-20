# Demo 06 - Recording rules, alerts & Alertmanager

```bash
docker compose up -d --build
docker compose exec prometheus promtool check rules /etc/prometheus/rules/alerts.yml

open http://localhost:9090/rules       # recording + alerting rules
open http://localhost:9090/alerts      # inactive -> pending -> firing
open http://localhost:9093             # Alertmanager UI
docker compose logs -f webhook         # notifications arrive here

# fire ShopDown (critical route), and see inhibition of the warnings
docker compose stop app
# resolve
docker compose start app

# silence an alert for 10 minutes
docker compose exec alertmanager amtool silence add alertname=ShopSlowCheckout \
  --duration=10m --comment="investigating" --alertmanager.url=http://localhost:9093
docker compose exec alertmanager amtool silence query --alertmanager.url=http://localhost:9093

docker compose down
```
