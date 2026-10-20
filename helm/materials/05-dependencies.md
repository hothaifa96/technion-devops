# Dependencies, Subcharts & Umbrella Charts

## Declare dependencies

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "16.x.x"
    repository: oci://registry-1.docker.io/bitnamicharts
    condition: postgresql.enabled
  - name: redis
    version: "20.x.x"
    repository: https://charts.bitnami.com/bitnami
    alias: cache
    tags: [backend]
  - name: api
    version: 0.1.0
    repository: file://../api          # local chart
```

```bash
helm dependency update ./chart     # downloads to charts/ and writes Chart.lock
helm dependency build ./chart      # rebuild from Chart.lock
helm dependency list ./chart
```

---

## Configure a subchart from the parent

Values under the **subchart name (or alias)** go to the subchart:

```yaml
# parent values.yaml
postgresql:
  enabled: true
  auth:
    database: app
    username: app
    password: changeme
cache:
  architecture: standalone
```

## Global values

```yaml
global:
  imageRegistry: myregistry.io
  env: prod
```

Accessible in every chart as `.Values.global.env`.

---

## Umbrella chart

One parent chart that deploys a whole system from several charts:

```
shop/                       # umbrella
├── Chart.yaml              # dependencies: frontend, api, postgresql
├── values.yaml             # config for every component
└── charts/
    ├── frontend/
    └── api/
```

```bash
helm upgrade --install shop ./shop -n shop --create-namespace
```

---

## Library charts

```yaml
# common/Chart.yaml
type: library
```

Contain only `define` blocks (labels, standard deployment), reused by many app charts:

```yaml
{{ include "common.labels" . }}
```

---

## Parent → subchart template access

- A subchart **cannot** see the parent's values (except `global`)
- A parent can see subchart values: `.Values.postgresql.auth.database`
- Use `import-values` / `exports` to pass values up
