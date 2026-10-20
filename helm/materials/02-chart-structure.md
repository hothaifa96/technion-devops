# Chart Structure

```bash
helm create mychart
```

```
mychart/
├── Chart.yaml            # metadata (name, version, appVersion, dependencies)
├── values.yaml           # default configuration
├── values.schema.json    # (optional) JSON schema validation of values
├── charts/               # dependency charts (.tgz)
├── templates/
│   ├── _helpers.tpl      # named templates (no output - starts with _)
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── serviceaccount.yaml
│   ├── NOTES.txt         # printed after install
│   └── tests/
│       └── test-connection.yaml
└── .helmignore           # files to exclude when packaging
```

---

## Chart.yaml

```yaml
apiVersion: v2              # Helm 3
name: mychart
description: My web application
type: application           # or "library"
version: 0.1.0              # CHART version (SemVer) - bump on every chart change
appVersion: "1.16.0"        # version of the APP inside (image tag default)
keywords: [web, flask]
maintainers:
  - name: DevOps Team
    email: devops@example.com
dependencies:
  - name: redis
    version: "20.x.x"
    repository: oci://registry-1.docker.io/bitnamicharts
    condition: redis.enabled
```

| Field | Meaning |
|-------|---------|
| `version` | chart version - what `helm install --version` refers to |
| `appVersion` | informational, usually used as default image tag |
| `type: library` | only reusable helpers, cannot be installed |

---

## values.yaml

```yaml
replicaCount: 2
image:
  repository: nginx
  tag: ""            # defaults to .Chart.AppVersion
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
ingress:
  enabled: false
  host: app.local
resources: {}
```

## A template

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mychart.fullname" . }}
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "mychart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "mychart.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          ports:
            - containerPort: 80
```

---

## Workflow while developing

```bash
helm lint ./mychart
helm template my-release ./mychart                 # render locally, no cluster
helm template my-release ./mychart -s templates/service.yaml
helm install my-release ./mychart --dry-run --debug
helm install my-release ./mychart
helm upgrade my-release ./mychart --set replicaCount=3
```
