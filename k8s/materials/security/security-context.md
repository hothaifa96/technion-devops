# Pod & Container Security Context

`securityContext` defines privilege and access control settings.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
spec:
  securityContext:                # pod level (all containers)
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 10001
    fsGroup: 10001                # group owner of mounted volumes
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: nginxinc/nginx-unprivileged:1.27-alpine
      securityContext:            # container level (overrides pod level)
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      volumeMounts:
        - name: tmp
          mountPath: /tmp
  volumes:
    - name: tmp
      emptyDir: {}
```

---

## Fields

| Field | Level | Purpose |
|-------|-------|---------|
| `runAsUser` / `runAsGroup` | pod/container | UID/GID of the process |
| `runAsNonRoot` | pod/container | refuse to start if UID 0 |
| `fsGroup` | pod | volume group ownership |
| `readOnlyRootFilesystem` | container | immutable container FS |
| `allowPrivilegeEscalation` | container | block setuid / sudo |
| `privileged` | container | full host access (avoid!) |
| `capabilities.add/drop` | container | fine-grained Linux capabilities (`NET_BIND_SERVICE`, `SYS_ADMIN`) |
| `seccompProfile` | pod/container | syscall filtering |
| `appArmorProfile` / `seLinuxOptions` | pod/container | MAC policies |

---

## Other pod-level security fields

```yaml
spec:
  automountServiceAccountToken: false   # no API token if not needed
  hostNetwork: false
  hostPID: false
  hostIPC: false
```

---

## Verify

```bash
kubectl exec secure-app -- id
kubectl exec secure-app -- touch /test      # Read-only file system
kubectl exec secure-app -- touch /tmp/ok    # works (emptyDir)
```
