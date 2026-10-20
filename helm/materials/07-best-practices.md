# Packaging, Registries, Best Practices & GitOps

## Package & publish

```bash
helm package ./mychart                 # -> mychart-0.1.0.tgz
helm package ./mychart --version 0.2.0 --app-version 1.4.2
```

### OCI registry (recommended - Docker Hub, ECR, GHCR, Harbor)

```bash
helm registry login registry-1.docker.io -u myuser
helm push mychart-0.1.0.tgz oci://registry-1.docker.io/myuser
helm install web oci://registry-1.docker.io/myuser/mychart --version 0.1.0
helm show values oci://registry-1.docker.io/myuser/mychart --version 0.1.0
```

### Classic HTTP repo (GitHub Pages / S3)

```bash
helm package ./mychart -d docs/
helm repo index docs/ --url https://myuser.github.io/charts
# push docs/ to GitHub Pages
helm repo add myrepo https://myuser.github.io/charts
```

---

## Best practices

| Area | Practice |
|------|----------|
| Naming | chart names lowercase with dashes; resource names via `fullname` helper, `trunc 63` |
| Labels | use standard `app.kubernetes.io/*` labels |
| Values | camelCase, flat when possible, document every value with comments |
| Defaults | sane defaults that work with `helm install x ./chart` |
| Images | never hard-code tags in templates; default to `.Chart.AppVersion` |
| Resources | expose `resources`, `nodeSelector`, `tolerations`, `affinity`, `podAnnotations` |
| Secrets | don't commit real secrets in values - use External Secrets / SOPS (helm-secrets) / Sealed Secrets |
| Validation | `values.schema.json`, `required`, `helm lint`, `helm template \| kubeconform` |
| Versioning | bump `version` on every chart change (SemVer); `appVersion` = app release |
| Config changes | `checksum/config` annotation to roll pods |
| CI | `helm lint`, `helm template`, chart-testing (`ct lint`), `helm diff` |
| Deploy | `helm upgrade --install --atomic --wait` |

```bash
helm template web ./chart | kubeconform -strict -summary
```

---

## Helm & GitOps (Argo CD)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: web-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/deploy.git
    path: charts/web
    targetRevision: main
    helm:
      valueFiles:
        - values-prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: prod
  syncPolicy:
    automated: { prune: true, selfHeal: true }
```

Argo CD renders the chart with `helm template` and applies it - CI only updates `image.tag` in Git.

---

## Helm vs Kustomize

| | Helm | Kustomize |
|---|---|---|
| Approach | templating | patching plain YAML (overlays) |
| Packaging/versioning | ✔ charts, repos | ✘ |
| Logic (if/range) | ✔ | ✘ |
| Built into kubectl | ✘ | ✔ `kubectl apply -k` |
| Lifecycle (rollback, hooks) | ✔ | ✘ |
