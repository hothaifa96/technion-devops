# Release Lifecycle & Multiple Environments

## Release states

```
install ─▶ deployed (rev 1) ─upgrade─▶ deployed (rev 2) ─rollback 1─▶ deployed (rev 3 = copy of rev 1)
                                  └─ failed / pending-upgrade (stuck!)
```

```bash
helm history web
REVISION  STATUS      CHART        APP VERSION  DESCRIPTION
1         superseded  web-0.1.0    1.0          Install complete
2         superseded  web-0.2.0    1.1          Upgrade complete
3         deployed    web-0.1.0    1.0          Rollback to 1
```

---

## Upgrade flags you should know

| Flag | Meaning |
|------|---------|
| `--install` | install if the release does not exist |
| `--atomic` | roll back automatically if the upgrade fails |
| `--wait` | wait until resources are ready |
| `--timeout 5m` | how long to wait |
| `--reuse-values` | keep previous values and merge `--set` |
| `--reset-values` | start from chart defaults |
| `--cleanup-on-fail` | delete new resources on failure |
| `--force` | recreate resources |
| `--dry-run` | simulate |

CI/CD standard command:

```bash
helm upgrade --install web ./chart \
  -n prod --create-namespace \
  -f values.yaml -f values-prod.yaml \
  --set image.tag=$GIT_SHA \
  --atomic --wait --timeout 5m
```

---

## Environments with values files

```
chart/
├── values.yaml           # defaults (shared)
├── values-dev.yaml       # 1 replica, debug, no ingress TLS
├── values-staging.yaml
└── values-prod.yaml      # 5 replicas, HPA, resources, TLS
```

```bash
helm upgrade --install web ./chart -n dev     -f chart/values-dev.yaml
helm upgrade --install web ./chart -n prod    -f chart/values-prod.yaml
```

---

## Diff before upgrade

```bash
helm plugin install https://github.com/databus23/helm-diff
helm diff upgrade web ./chart -f values-prod.yaml
```

---

## Where is the release stored?

```bash
kubectl get secrets -n prod -l owner=helm
kubectl get secret sh.helm.release.v1.web.v3 -n prod -o jsonpath='{.data.release}' \
  | base64 -d | base64 -d | gunzip | jq '.info'
```

`--history-max 10` (default 10) limits stored revisions.

---

## Fixing a stuck release

```bash
helm history web                # STATUS: pending-upgrade
helm rollback web <last-good-revision>
```
