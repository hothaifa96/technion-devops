# Deployment Rollout Strategies

## RollingUpdate (default)

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%         # extra pods above replicas during update
      maxUnavailable: 0     # zero downtime
  minReadySeconds: 5
  revisionHistoryLimit: 10
```

## Recreate

```yaml
spec:
  strategy:
    type: Recreate          # kill all old, then start new (downtime) - e.g. RWO volume / DB schema
```

---

## Rollout commands

```bash
kubectl set image deploy/web web=nginx:1.27
kubectl rollout status deploy/web
kubectl rollout history deploy/web
kubectl annotate deploy/web kubernetes.io/change-cause="upgrade to 1.27"
kubectl rollout undo deploy/web
kubectl rollout undo deploy/web --to-revision=2
kubectl rollout pause deploy/web
kubectl rollout resume deploy/web
kubectl rollout restart deploy/web
```

---

## Blue/Green with labels

```
Service selector: app=web, version=blue  ──▶ blue pods (v1)
                                             green pods (v2) - tested
switch: kubectl patch svc web -p '{"spec":{"selector":{"app":"web","version":"green"}}}'
```

## Canary (basic)

Two Deployments behind the same Service selector `app=web`:
- `web-stable` 9 replicas
- `web-canary` 1 replica  → ~10% traffic

For percentage-based routing use Ingress-NGINX canary annotations, Gateway API weights, Argo Rollouts or a service mesh.
