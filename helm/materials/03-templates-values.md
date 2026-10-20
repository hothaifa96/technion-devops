# Templates, Values, Functions & Helpers

Helm uses Go templates + [Sprig](https://masterminds.github.io/sprig/) functions.

---

## Built-in objects

| Object | Example |
|--------|---------|
| `.Values` | `{{ .Values.image.tag }}` |
| `.Release` | `.Release.Name`, `.Release.Namespace`, `.Release.Revision`, `.Release.IsUpgrade`, `.Release.IsInstall` |
| `.Chart` | `.Chart.Name`, `.Chart.Version`, `.Chart.AppVersion` |
| `.Capabilities` | `.Capabilities.KubeVersion`, `.Capabilities.APIVersions.Has "networking.k8s.io/v1"` |
| `.Template` | `.Template.Name` |
| `.Files` | `.Files.Get "config/app.conf"` |

---

## Pipelines & functions

```yaml
name: {{ .Values.name | upper | quote }}
tag: {{ .Values.image.tag | default .Chart.AppVersion }}
env: {{ .Values.env | default "dev" | lower }}
replicas: {{ required "replicaCount is required" .Values.replicaCount }}
checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
password: {{ randAlphaNum 16 | b64enc }}
```

| Function | Purpose |
|----------|---------|
| `quote` / `squote` | wrap in quotes |
| `default` | fallback value |
| `required` | fail rendering with message |
| `upper` / `lower` / `title` / `trunc 63` / `trimSuffix "-"` | strings |
| `toYaml` / `toJson` / `fromYaml` | serialization |
| `indent N` / `nindent N` | indentation (nindent adds a newline first) |
| `b64enc` / `b64dec` / `sha256sum` | encoding |
| `eq` / `ne` / `lt` / `gt` / `and` / `or` / `not` | logic |
| `lookup` | read live objects from the cluster |
| `tpl` | render a string as a template |

---

## Whitespace control

```yaml
{{- if .Values.debug }}     # "{{-" trims whitespace BEFORE
  debug: true
{{- end }}                  # "-}}" trims whitespace AFTER
```

---

## Flow control

### if / else

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
...
{{- end }}

{{- if eq .Values.env "prod" }}
replicas: 5
{{- else if eq .Values.env "staging" }}
replicas: 2
{{- else }}
replicas: 1
{{- end }}
```

### with (change scope)

```yaml
{{- with .Values.nodeSelector }}
nodeSelector:
  {{- toYaml . | nindent 2 }}
{{- end }}
```

### range (loops)

```yaml
env:
{{- range $key, $value := .Values.env }}
  - name: {{ $key }}
    value: {{ $value | quote }}
{{- end }}

{{- range .Values.ingress.hosts }}
  - host: {{ .host }}
{{- end }}
```

> Inside `range` / `with`, `.` changes. Use `$` to access the root: `{{ $.Release.Name }}`.

### Variables

```yaml
{{- $fullName := include "mychart.fullname" . -}}
{{- $svcPort := .Values.service.port -}}
```

---

## Named templates (_helpers.tpl)

```yaml
{{- define "mychart.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "mychart.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end }}
```

Use: `{{ include "mychart.labels" . | nindent 4 }}` (prefer `include` over `template` because it can be piped).

---

## Files

```yaml
# templates/configmap.yaml
data:
  app.conf: |-
{{ .Files.Get "files/app.conf" | indent 4 }}
{{ (.Files.Glob "files/*.json").AsConfig | indent 2 }}
```

---

## Auto-rollout on config change

```yaml
spec:
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
```

---

## values.schema.json

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["replicaCount", "image"],
  "properties": {
    "replicaCount": { "type": "integer", "minimum": 1 },
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": { "repository": { "type": "string" }, "tag": { "type": "string" } }
    }
  }
}
```
