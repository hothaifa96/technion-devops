# Lab 02: Write Your First Chart

## Objective

Convert plain Kubernetes YAML into a reusable Helm chart.

## Prerequisites

- Read [materials/02-chart-structure.md](../../materials/02-chart-structure.md)
- Reference: [class-code/02-my-first-chart](../../class-code/02-my-first-chart)

## Starting point

`starter/` contains plain YAML for a Flask "quotes" app (Deployment, Service, ConfigMap). Image: the one you built in Docker lab 01 (or `traefik/whoami`).

## Exercise

### Step 1: Scaffold
1. `helm create quotes` and look at every generated file. What does each one do?
2. Delete everything in `templates/` except `_helpers.tpl` and `NOTES.txt`. Empty `values.yaml`.

### Step 2: Templatize
Move the starter YAMLs into `templates/` and replace hard-coded values with `.Values`:
- `replicaCount`
- `image.repository`, `image.tag` (default to `.Chart.AppVersion`), `image.pullPolicy`
- `service.type`, `service.port`
- `config` (a map rendered into the ConfigMap)
- Names via the `fullname` helper, labels via the `labels` helper

### Step 3: Validate
1. `helm lint ./quotes`
2. `helm template q ./quotes` - read the output carefully
3. `helm install q ./quotes --dry-run --debug`

### Step 4: Install twice
1. Install `quotes-a` and `quotes-b` in the same namespace with different `config` values.
2. Prove there are no name collisions.

### Step 5: NOTES.txt
Write a NOTES.txt that prints the port-forward command, and if `service.type` is `NodePort`, prints `minikube service` instructions instead.

### Step 6: Versioning
1. Change the default replicas, bump the chart `version` to `0.2.0`, upgrade the release.
2. `helm history` - where do you see the chart version?

## Challenge Exercise

1. Add `resources`, `nodeSelector`, `tolerations` using `with` + `toYaml`.
2. Add a `values.schema.json` that requires `image.repository` and validates `service.type`.
3. Package the chart (`helm package`) and install from the `.tgz`.

## Deliverables
The `quotes/` chart folder.
