# Demo 04 - Umbrella Chart & Subcharts

```bash
helm dependency list ./shop       # local subcharts live in shop/charts/ (no repository needed)
# uncomment redis in Chart.yaml, then: helm dependency update ./shop  -> downloads .tgz + Chart.lock
helm lint ./shop
helm template shop ./shop

# global values reach every subchart; subchart values are scoped by name
helm template shop ./shop --set global.environment=prod --set api.replicaCount=5 | grep -E "replicas|environment|WHOAMI" -A1

# disable a component with its condition
helm template shop ./shop --set frontend.enabled=false | grep "kind:"

helm upgrade --install shop ./shop -n shop --create-namespace
kubectl -n shop get all
helm uninstall shop -n shop
```
