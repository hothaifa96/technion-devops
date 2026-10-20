# Demo 03 - Advanced Templating & Environments

Shows: `if`, `with`, `range`, variables, `$`, helpers, `.Files` + `tpl`, `b64enc`, `checksum/config`, `values.schema.json`, values per environment.

```bash
helm lint ./webapp
helm lint ./webapp -f webapp/values-prod.yaml

# render the differences between environments
helm template web ./webapp -f webapp/values-dev.yaml  > /tmp/dev.yaml
helm template web ./webapp -f webapp/values-prod.yaml > /tmp/prod.yaml
diff /tmp/dev.yaml /tmp/prod.yaml

# render one template
helm template web ./webapp -s templates/configmap.yaml

# schema validation in action
helm template web ./webapp --set environment=qa          # fails: enum
helm template web ./webapp --set replicaCount=0          # fails: minimum

# install dev, change config -> pods roll automatically (checksum)
helm upgrade --install web ./webapp -n dev --create-namespace -f webapp/values-dev.yaml
kubectl -n dev port-forward svc/web-webapp 8080:80 &
curl localhost:8080
helm upgrade web ./webapp -n dev -f webapp/values-dev.yaml --set page.title="changed!"
kubectl -n dev get pods -w

# prod-like install with atomic upgrade
helm upgrade --install web ./webapp -n prod --create-namespace -f webapp/values-prod.yaml --atomic --wait --timeout 2m
helm get values web -n prod --all | head -30

helm uninstall web -n dev; helm uninstall web -n prod
```
