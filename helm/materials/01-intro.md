# Helm Introduction

## The problem

A real app = Deployment + Service + Ingress + ConfigMap + Secret + HPA + ... × dev / staging / prod.
Copy-pasting YAML per environment does not scale.

## What is Helm?

**The package manager for Kubernetes** (like apt / npm / pip).

| Concept | Meaning |
|---------|---------|
| **Chart** | A package: templated Kubernetes manifests + default values |
| **Values** | Configuration that fills the templates |
| **Release** | An installed instance of a chart in a cluster (name + revision) |
| **Repository** | Place where charts are stored (HTTP index or OCI registry) |
| **Revision** | Every install/upgrade/rollback creates a new numbered revision |

```
 chart (templates) + values.yaml + --set/-f  ──helm──▶  rendered YAML  ──▶  K8s API
                                                         release "web" rev 3
```

Helm 3 is client-only (no Tiller). Release state is stored as **Secrets** in the release namespace (`sh.helm.release.v1.<name>.v<rev>`).

---

## Install

```bash
brew install helm
helm version
```

---

## Repositories

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo list
helm repo update
helm search repo nginx
helm search hub wordpress           # Artifact Hub
```

---

## Inspect a chart before installing

```bash
helm show chart bitnami/nginx
helm show values bitnami/nginx > nginx-values.yaml
helm show readme bitnami/nginx
helm pull bitnami/nginx --untar     # download & look inside
```

---

## Install / Upgrade / Rollback / Uninstall

```bash
helm install my-web bitnami/nginx -n web --create-namespace
helm install my-web bitnami/nginx --set replicaCount=3 --set service.type=NodePort
helm install my-web bitnami/nginx -f my-values.yaml --version 18.1.0

helm list -A
helm status my-web -n web
helm get values my-web -n web
helm get manifest my-web -n web

helm upgrade my-web bitnami/nginx -n web --set replicaCount=5
helm upgrade --install my-web bitnami/nginx -n web -f my-values.yaml   # idempotent (CI!)

helm history my-web -n web
helm rollback my-web 1 -n web

helm uninstall my-web -n web
```

---

## Value precedence (lowest → highest)

1. `values.yaml` in the chart
2. Parent chart values (for subcharts)
3. `-f file1.yaml -f file2.yaml` (last wins)
4. `--set key=value` / `--set-string` / `--set-file`

```bash
--set image.tag=1.2.3
--set ingress.hosts[0].host=app.local
--set-string podAnnotations."prometheus\.io/scrape"=true
```
