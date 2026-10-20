# Lab 01: Using Public Charts

## Objective

Install, configure, upgrade and roll back third-party applications with Helm.

## Prerequisites

- minikube / any cluster, Helm 3
- Read [materials/01-intro.md](../../materials/01-intro.md)

## Exercise

### Step 1: Repositories
1. Add the `bitnami`, `prometheus-community` and `grafana` repositories.
2. Search for all charts containing `redis`. What is the latest chart version and app version of `bitnami/redis`?
3. Find the `wordpress` chart on [Artifact Hub](https://artifacthub.io) with `helm search hub`.

### Step 2: Inspect
1. Save the default values of `bitnami/wordpress` into `wp-defaults.yaml`.
2. Find the values that control: the admin username/password, service type, persistence size, and the MariaDB subchart.

### Step 3: Install WordPress
1. Create `wp-values.yaml` that sets: admin user `technion`, blog name `DevOps Blog`, service type `NodePort`, persistence size `2Gi`, MariaDB persistence `1Gi`.
2. Install a release `blog` in namespace `wordpress`.
3. Follow the NOTES to log in. Write a post.

### Step 4: Explore the release
1. `helm list -A`, `helm status`, `helm get values` (with and without `--all`), `helm get manifest | grep kind:`.
2. Which Kubernetes objects did the chart create? List them.
3. Find the Secret where Helm stores the release.

### Step 5: Upgrade & rollback
1. Upgrade with `--set replicaCount=2`. Check `helm history`.
2. Upgrade with an **invalid** value (e.g. `--set service.type=Wrong`) using `--atomic`. What happened?
3. Roll back to revision 1. Is your post still there? Why?

### Step 6: Uninstall
Uninstall the release. Which resources are left (hint: PVCs)? Why does Helm keep them?

## Challenge Exercise

1. Install `kube-prometheus-stack` in namespace `monitoring` with Grafana exposed as NodePort and log in to Grafana.
2. Use `helm template` to render `bitnami/redis` with `architecture=standalone` and count the resources with `grep -c "^kind:"`.
3. Explain the difference between `--reuse-values` and `--reset-values` with an example.

## Deliverables
`wp-values.yaml`, `commands.md`, answers.
