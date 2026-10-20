# Demo 02 - My First Chart

Built live from plain YAML -> templated chart.

```bash
# 0. what helm create gives you
helm create sample && tree sample && rm -rf sample

# 1. validate & render
helm lint ./whoami
helm template demo ./whoami
helm template demo ./whoami --set replicaCount=5 --set greeting=technion | grep -E "replicas|value"

# 2. install
helm install demo ./whoami -n first-chart --create-namespace
kubectl -n first-chart get all -l app.kubernetes.io/instance=demo

# 3. upgrade by values
helm upgrade demo ./whoami -n first-chart --set replicaCount=4
helm history demo -n first-chart

# 4. second release from the same chart
helm install demo2 ./whoami -n first-chart --set greeting=second
helm list -n first-chart

# 5. rollback
helm rollback demo 1 -n first-chart

helm uninstall demo demo2 -n first-chart
```
