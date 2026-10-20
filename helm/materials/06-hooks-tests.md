# Hooks & Tests

## Hooks

Hooks let you run resources (usually Jobs) at specific points in the release lifecycle.

| Hook | When |
|------|------|
| `pre-install` | after rendering, before any resource is created |
| `post-install` | after all resources are created |
| `pre-upgrade` | before upgrade (e.g. DB migration, backup) |
| `post-upgrade` | after upgrade (e.g. cache warm-up, notification) |
| `pre-delete` / `post-delete` | around uninstall |
| `pre-rollback` / `post-rollback` | around rollback |
| `test` | when running `helm test` |

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "app.fullname" . }}-db-migrate
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"                         # lower runs first
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 1
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command: ["python", "manage.py", "migrate"]
```

| Delete policy | Meaning |
|---------------|---------|
| `before-hook-creation` | delete previous hook resource before a new one (default) |
| `hook-succeeded` | delete after success |
| `hook-failed` | delete after failure |

> If a hook Job fails, the install/upgrade fails.
> Hook resources are **not** managed as part of the release (not deleted by `helm uninstall`).

---

## Tests

```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "app.fullname" . }}-test"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: curl
      image: curlimages/curl:8.10.1
      command: ["curl", "-sf", "http://{{ include "app.fullname" . }}:{{ .Values.service.port }}/health"]
```

```bash
helm test my-release
helm test my-release --logs
```

Use in CI after `helm upgrade --install --wait` as a smoke test.
