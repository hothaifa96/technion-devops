# Resources, Limits & QoS

```yaml
resources:
  requests:          # used by the SCHEDULER - guaranteed amount
    cpu: "250m"      # 0.25 core
    memory: "128Mi"
  limits:            # enforced by the KERNEL (cgroups)
    cpu: "500m"
    memory: "256Mi"
```

| | Exceeds CPU limit | Exceeds memory limit |
|---|---|---|
| Result | **Throttled** (slowed down) | **OOMKilled** (exit 137) and restarted |

Units: CPU `1` = 1 vCPU = `1000m`. Memory `Mi`/`Gi` (binary) or `M`/`G` (decimal).

---

## QoS Classes

| Class | Condition | Eviction priority |
|-------|-----------|-------------------|
| **Guaranteed** | requests == limits for every container (cpu+mem) | evicted last |
| **Burstable** | at least one request/limit set | middle |
| **BestEffort** | nothing set | evicted first |

```bash
kubectl get pod web -o jsonpath='{.status.qosClass}'
```

---

## LimitRange - defaults per namespace

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: defaults
  namespace: dev
spec:
  limits:
    - type: Container
      default:          { cpu: 500m, memory: 256Mi }   # limits
      defaultRequest:   { cpu: 100m, memory: 128Mi }   # requests
      max:              { cpu: "1",  memory: 1Gi }
```

## ResourceQuota - total per namespace

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: dev
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "20"
    services.loadbalancers: "1"
```

```bash
kubectl describe quota -n dev
kubectl describe limitrange -n dev
kubectl top pods
```
