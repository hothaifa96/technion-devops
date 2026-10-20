# Demo 05 - Hooks & Tests

```bash
helm lint ./hooks-demo

# watch hooks run in order: migrate (pre) -> app -> notify (post)
kubectl get jobs,pods -n hooks -w &
helm install hk ./hooks-demo -n hooks --create-namespace --wait
kubectl -n hooks logs job/hk-migrate

# smoke test
helm test hk -n hooks --logs

# upgrade -> pre-upgrade migration runs again
helm upgrade hk ./hooks-demo -n hooks --set replicaCount=2

# failing hook blocks the upgrade
helm upgrade hk ./hooks-demo -n hooks --set failMigration=true --set replicaCount=3
helm history hk -n hooks           # rev 3 failed
kubectl -n hooks get deploy        # still 2 replicas - the app was NOT touched

# hook resources are not deleted by uninstall
helm uninstall hk -n hooks
kubectl -n hooks get jobs
kubectl delete ns hooks
```
