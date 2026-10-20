# Health Probes

The kubelet checks container health with three probe types.

| Probe | Question | On failure |
|-------|----------|------------|
| **startupProbe** | Has the app finished starting? | Kill & restart container (other probes disabled until success) |
| **livenessProbe** | Is the app alive (not deadlocked)? | Kill & restart container |
| **readinessProbe** | Can the app receive traffic now? | Remove Pod IP from Service endpoints (no restart) |

```
start ─▶ startupProbe OK ─▶ liveness + readiness run forever
                               │              │
                         fail: restart   fail: no traffic
```

---

## Probe mechanisms

```yaml
httpGet:            # 200-399 = success
  path: /healthz
  port: 8080
tcpSocket:          # port open = success
  port: 5432
exec:               # exit 0 = success
  command: ["cat", "/tmp/healthy"]
grpc:
  port: 9090
```

---

## Full example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports:
            - containerPort: 80
          startupProbe:
            httpGet: { path: /, port: 80 }
            failureThreshold: 30
            periodSeconds: 2
          livenessProbe:
            httpGet: { path: /, port: 80 }
            periodSeconds: 10
            timeoutSeconds: 2
            failureThreshold: 3
          readinessProbe:
            httpGet: { path: /, port: 80 }
            periodSeconds: 5
            successThreshold: 1
```

---

## Parameters

| Field | Default | Meaning |
|-------|---------|---------|
| `initialDelaySeconds` | 0 | wait before first probe |
| `periodSeconds` | 10 | how often |
| `timeoutSeconds` | 1 | probe timeout |
| `failureThreshold` | 3 | failures before action |
| `successThreshold` | 1 | successes to be considered OK (readiness) |

---

## Best practices

- Liveness should check **only the process itself**, not dependencies (DB down -> restarting your app won't help)
- Readiness may check dependencies
- Use `startupProbe` for slow starting apps instead of a huge `initialDelaySeconds`
- Readiness is critical for **zero-downtime rolling updates**

```bash
kubectl describe pod <pod>     # Events: Liveness probe failed ...
kubectl get endpoints <svc>    # not-ready pods are missing
```
