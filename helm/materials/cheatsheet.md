# Helm - Full Cheat Sheet

## Concepts

| Term            | Meaning                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Chart           | package of templates + default values                                  |
| Values          | configuration injected into templates                                  |
| Release         | installed instance of a chart (name + namespace)                       |
| Revision        | number incremented by every install/upgrade/rollback                   |
| Repository      | HTTP index (`index.yaml`) or OCI registry storing charts               |
| Release storage | Secrets `sh.helm.release.v1.<release>.v<rev>` in the release namespace |

---

## Repositories & search

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add jenkins https://charts.jenkins.io
helm repo list
helm repo update
helm repo remove bitnami
helm search repo nginx [--versions] [--devel]
helm search hub wordpress                         # Artifact Hub
```

## Inspect charts

```bash
helm show chart bitnami/nginx
helm show values bitnami/nginx > values.yaml
helm show readme bitnami/nginx
helm show all bitnami/nginx
helm pull bitnami/nginx --untar [--version 18.1.0]
helm show values oci://registry-1.docker.io/bitnamicharts/redis
```

---

## Release lifecycle

```bash
helm install web bitnami/nginx -n web --create-namespace
helm install web ./chart -f values.yaml -f values-prod.yaml --set image.tag=1.2.3
helm install web ./chart --generate-name
helm install web ./chart --dry-run --debug

helm upgrade web ./chart -f values-prod.yaml
helm upgrade --install web ./chart -n prod --create-namespace \
  -f values-prod.yaml --set image.tag=$TAG --atomic --wait --timeout 5m

helm list [-n ns | -A] [--all] [--failed] [--pending]
helm status web -n prod
helm history web -n prod
helm rollback web 2 -n prod [--wait]
helm uninstall web -n prod [--keep-history]

helm get values web [--all] [--revision 2]
helm get manifest web
helm get notes web
helm get hooks web
helm get all web
helm test web [--logs]
```

### Upgrade flags

| Flag                         | Meaning                                   |
| ---------------------------- | ----------------------------------------- |
| `--install` / `-i`           | install if missing                        |
| `--atomic`                   | rollback on failure (implies `--wait`)    |
| `--wait` / `--wait-for-jobs` | wait until resources/jobs are ready       |
| `--timeout 5m`               | wait limit                                |
| `--reuse-values`             | keep last release values, merge new       |
| `--reset-values`             | back to chart defaults                    |
| `--reset-then-reuse-values`  | defaults + last values + new (Helm 3.14+) |
| `--cleanup-on-fail`          | delete new resources on failure           |
| `--force`                    | replace resources                         |
| `--history-max 10`           | revisions to keep                         |
| `--create-namespace`         | create ns if missing                      |
| `--version 1.2.3`            | chart version                             |
| `--dry-run=server`           | validate against the API                  |

### Value precedence (low → high)

`values.yaml` (chart) → parent chart values → `-f a.yaml -f b.yaml` (last wins) → `--set` / `--set-string` / `--set-file` / `--set-json`

```bash
--set replicaCount=3
--set image.tag=1.2.3
--set ingress.hosts[0].host=app.local
--set-string podAnnotations."prometheus\.io/scrape"=true
--set-file config=./app.conf
--set-json 'resources={"limits":{"memory":"256Mi"}}'
--set tags={a,b,c}
```

---

## Chart development

```bash
helm create mychart
helm lint ./mychart [-f values-prod.yaml] [--strict]
helm template rel ./mychart [-f values.yaml] [--set x=y] [-n ns]
helm template rel ./mychart -s templates/deployment.yaml
helm template rel ./mychart --debug                 # show broken YAML
helm template rel ./mychart | kubeconform -strict -summary
helm install rel ./mychart --dry-run --debug
helm package ./mychart [--version 0.2.0] [--app-version 1.4.2] [-d dist/]
helm dependency update|build|list ./mychart
helm plugin install https://github.com/databus23/helm-diff
helm diff upgrade rel ./mychart -f values-prod.yaml
```

### Structure

```
mychart/
├── Chart.yaml           # apiVersion v2, name, version, appVersion, dependencies
├── Chart.lock           # locked dependency versions
├── values.yaml
├── values.schema.json   # optional JSON schema validation
├── charts/              # subcharts / dependency .tgz
├── crds/                # CRDs installed first (never upgraded/deleted)
├── templates/
│   ├── _helpers.tpl     # named templates, no output
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── NOTES.txt
│   └── tests/test-connection.yaml
└── .helmignore
```

### Chart.yaml

```yaml
apiVersion: v2
name: mychart
description: My app
type: application # or library
version: 0.1.0 # chart version - bump on every change
appVersion: "1.16.0" # app version - default image tag
kubeVersion: ">=1.25.0-0"
dependencies:
  - name: postgresql
    version: "16.x.x"
    repository: oci://registry-1.docker.io/bitnamicharts
    condition: postgresql.enabled
    alias: db
    tags: [database]
    import-values: [child.exported]
```

---

## Template language

### Built-in objects

| Object          | Fields                                                         |
| --------------- | -------------------------------------------------------------- |
| `.Values`       | values                                                         |
| `.Release`      | `.Name .Namespace .Revision .IsInstall .IsUpgrade .Service`    |
| `.Chart`        | `.Name .Version .AppVersion .Description`                      |
| `.Capabilities` | `.KubeVersion.Version .APIVersions.Has "networking.k8s.io/v1"` |
| `.Template`     | `.Name .BasePath`                                              |
| `.Files`        | `.Get "f" .Glob "conf/*" .AsConfig .AsSecrets .Lines`          |

### Syntax

```yaml
{{ .Values.name }}                       # print
{{- .Values.name }}                      # trim whitespace left
{{ .Values.name -}}                      # trim right
{{/* comment */}}
{{ $var := .Values.x }}                  # variable
{{ $.Release.Name }}                     # root context anywhere
```

### Flow control

```yaml
{{- if .Values.ingress.enabled }}
...
{{- else if eq .Values.env "prod" }}
...
{{- else }}
...
{{- end }}

{{- if and .Values.a (not .Values.b) }}{{ end }}
{{- if or (eq .Values.env "prod") (gt (int .Values.replicas) 3) }}{{ end }}

{{- with .Values.nodeSelector }}
nodeSelector:
  {{- toYaml . | nindent 2 }}
{{- end }}

{{- range .Values.hosts }}
- host: {{ . | quote }}
{{- end }}

{{- range $key, $val := .Values.env }}
- name: {{ $key }}
  value: {{ $val | quote }}
{{- end }}

{{- range $i, $h := .Values.hosts }}{{ $i }}={{ $h }}{{ end }}
```

### Most used functions

| Category          | Functions                                                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Defaults / checks | `default "x"`, `required "msg"`, `empty`, `coalesce a b c`, `ternary "a" "b" cond`, `fail "msg"`                                                                                         |
| Strings           | `quote`, `squote`, `upper`, `lower`, `title`, `trim`, `trunc 63`, `trimSuffix "-"`, `replace "a" "b"`, `contains`, `hasPrefix`, `printf "%s-%s" a b`, `nospace`, `indent N`, `nindent N` |
| Type              | `int`, `toString`, `kindIs "map" .`, `typeOf`                                                                                                                                            |
| Encoding          | `b64enc`, `b64dec`, `sha256sum`, `toYaml`, `toJson`, `fromYaml`, `fromJson`                                                                                                              |
| Lists             | `list`, `append`, `first`, `last`, `has`, `uniq`, `join ","`, `splitList ","`, `until 3`                                                                                                 |
| Dicts             | `dict "k" "v"`, `get`, `set`, `hasKey`, `keys`, `merge`, `mergeOverwrite`, `pick`, `omit`, `deepCopy`                                                                                    |
| Random            | `randAlphaNum 16`, `uuidv4`                                                                                                                                                              |
| Cluster           | `lookup "v1" "Secret" .Release.Namespace "name"`                                                                                                                                         |
| Templates         | `include "name" .`, `template "name" .`, `tpl .Values.str .`                                                                                                                             |
| Semver            | `semverCompare ">=1.25-0" .Capabilities.KubeVersion.Version`                                                                                                                             |
| Date              | `now`, `date "2006-01-02" now`                                                                                                                                                           |

Comparison: `eq ne lt le gt ge` · Logic: `and or not`.

### \_helpers.tpl

```yaml
{{- define "mychart.fullname" -}}
{{- if contains .Chart.Name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "mychart.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "mychart.labels" -}}
{{ include "mychart.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end }}
```

Use: `{{- include "mychart.labels" . | nindent 4 }}`

### Common snippets

```yaml
image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"

{{- if not .Values.autoscaling.enabled }}
replicas: {{ .Values.replicaCount }}
{{- end }}

annotations:
  checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}

{{- with .Values.resources }}
resources:
  {{- toYaml . | nindent 12 }}
{{- end }}

data:
  app.conf: |-
    {{- tpl (.Files.Get "files/app.conf") . | nindent 4 }}
{{ (.Files.Glob "dashboards/*.json").AsConfig | indent 2 }}

# keep an existing random password on upgrade
{{- $old := lookup "v1" "Secret" .Release.Namespace "db" }}
password: {{ if $old }}{{ index $old.data "password" }}{{ else }}{{ randAlphaNum 16 | b64enc }}{{ end }}
```

---

## Hooks & tests

| Hook                             | When             |
| -------------------------------- | ---------------- |
| `pre-install` / `post-install`   | around install   |
| `pre-upgrade` / `post-upgrade`   | around upgrade   |
| `pre-rollback` / `post-rollback` | around rollback  |
| `pre-delete` / `post-delete`     | around uninstall |
| `test`                           | `helm test`      |

```yaml
metadata:
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5" # lower first
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded # | hook-failed
    "helm.sh/resource-policy": keep # (on normal resources) don't delete on uninstall
```

Failing hook → release fails. Hook resources aren't tracked by the release (not removed by `uninstall`).

---

## Dependencies / subcharts

- Configure subchart under its **name or alias**: `postgresql: { auth: { database: app } }`
- `global:` values visible to every chart (`.Values.global.x`)
- Subchart can't see parent values (except `global`); parent can read `.Values.<sub>.*`
- `condition: x.enabled` / `tags:` toggle subcharts
- `type: library` charts contain only `define`s

---

## Packaging & publishing

```bash
helm package ./mychart                          # mychart-0.1.0.tgz
# OCI
helm registry login registry-1.docker.io -u myuser
helm push mychart-0.1.0.tgz oci://registry-1.docker.io/myuser
helm install web oci://registry-1.docker.io/myuser/mychart --version 0.1.0
# HTTP repo (GitHub Pages / S3)
helm package ./mychart -d docs/
helm repo index docs/ --url https://myuser.github.io/charts
helm repo add mine https://myuser.github.io/charts
# signing
helm package --sign --key 'me' --keyring ~/.gnupg/secring.gpg ./mychart
helm verify mychart-0.1.0.tgz
```

---

## GitOps (Argo CD)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: web-prod, namespace: argocd }
spec:
  project: default
  source:
    repoURL: https://github.com/org/deploy.git
    path: charts/web
    targetRevision: main
    helm:
      {
        valueFiles: [values-prod.yaml],
        parameters: [{ name: image.tag, value: "1.2.3" }],
      }
  destination: { server: https://kubernetes.default.svc, namespace: prod }
  syncPolicy:
    {
      automated: { prune: true, selfHeal: true },
      syncOptions: [CreateNamespace=true],
    }
```

---

## Best practices

- [ ] Names via `fullname` helper, `trunc 63`; standard `app.kubernetes.io/*` labels
- [ ] Never hard-code image tags; default to `.Chart.AppVersion`
- [ ] Expose `resources`, `nodeSelector`, `tolerations`, `affinity`, `podAnnotations`, `securityContext`
- [ ] Document every value in `values.yaml`; add `values.schema.json`
- [ ] `| quote` strings, `toYaml | nindent` for blocks, `{{-` to avoid blank lines
- [ ] `checksum/config` annotation for config changes
- [ ] Bump chart `version` on every change (SemVer); commit `Chart.lock`
- [ ] No real secrets in values (External Secrets / SOPS / Sealed Secrets)
- [ ] CI: `helm lint` → `helm template | kubeconform` → `helm diff` → `helm upgrade --install --atomic` → `helm test`

---

## Troubleshooting

| Problem                                                       | Fix                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| `YAML parse error on templates/x.yaml`                        | `helm template --debug`, check indent / `nindent`                                                |
| `nil pointer evaluating interface {}.x`                       | missing value or `.` changed inside `range`/`with` → use `$` / `default`                         |
| `another operation (install/upgrade/rollback) is in progress` | `helm history` → `helm rollback <rel> <last-good>`                                               |
| `cannot re-use a name that is still in use`                   | `helm list -a`, uninstall or `upgrade --install`                                                 |
| `rendered manifests contain a resource that already exists`   | resource created outside Helm → delete or adopt (labels/annotations `meta.helm.sh/release-name`) |
| Hook "already exists"                                         | add `before-hook-creation` delete policy                                                         |
| Annotation/label value rejected                               | `                                                                                                | quote` |
| Changes in ConfigMap don't restart pods                       | `checksum/config` annotation                                                                     |
| Subchart value not applied                                    | wrong key - must be under subchart name/alias                                                    |
