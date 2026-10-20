# Lab 07: Package, Publish & GitOps

## Objective

Publish your chart to a registry, consume it like a public chart and deploy it with Argo CD.

## Prerequisites

- Read [materials/07-best-practices.md](../../materials/07-best-practices.md)
- Docker Hub or GHCR account

## Exercise

### Step 1: Package
1. `helm lint` and `helm package` your `quotes` chart.
2. Package a new version `0.3.0` with `--app-version 1.1`.

### Step 2: OCI registry
1. `helm registry login` to Docker Hub / GHCR.
2. `helm push` both versions.
3. From a clean directory: `helm show values oci://...` and `helm install` version `0.3.0`.
4. Upgrade to `0.3.0` and roll back to `0.2.0`.

### Step 3: GitHub Pages repo (classic)
1. Create a repo `helm-charts` with a `docs/` folder served by GitHub Pages.
2. `helm package -d docs/` + `helm repo index docs --url ...`
3. `helm repo add mycharts <url>` and `helm search repo mycharts`.

### Step 4: CI for charts
Write a Jenkinsfile / GitHub Action that on every push:
1. `helm lint`
2. `helm template | kubeconform -strict`
3. If `Chart.yaml` version changed on `main` -> package and push to the OCI registry.

### Step 5: Argo CD
1. Install Argo CD (`helm install argocd argo/argo-cd -n argocd --create-namespace`).
2. Create an `Application` pointing to your chart in Git with `values-prod.yaml`.
3. Enable automated sync + self-heal. Delete the Deployment manually - what happens?
4. Change `image.tag` in Git - how does Argo CD react?

## Challenge Exercise

1. Sign your chart with `helm package --sign` (GPG) or cosign for OCI and verify it.
2. Compare: Helm-only CD (`helm upgrade` from Jenkins) vs GitOps (Argo CD) - pros/cons table.

## Deliverables
Registry URL, Jenkinsfile/workflow, Argo CD Application YAML.
