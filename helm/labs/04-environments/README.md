# Lab 04: Release Lifecycle & Multiple Environments

## Objective

Deploy the same chart to dev, staging and prod with different configuration and safe upgrades.

## Prerequisites

- Read [materials/04-release-lifecycle.md](../../materials/04-release-lifecycle.md)

## Exercise

### Step 1: Values per environment
Create in your chart:

| File | replicas | resources | ingress host | HPA | log level |
|------|----------|-----------|--------------|-----|-----------|
| `values-dev.yaml` | 1 | none | dev.quotes.local | off | debug |
| `values-staging.yaml` | 2 | small | staging.quotes.local | off | info |
| `values-prod.yaml` | 3 | medium | quotes.local | on (3-10) | warn |

### Step 2: Deploy all three
Use one idempotent command per environment (`helm upgrade --install ... -n <env> --create-namespace -f ...`).

### Step 3: Diff
1. Install the `helm-diff` plugin.
2. Change the prod replicas and run `helm diff upgrade` before applying.

### Step 4: Atomic upgrades
1. Upgrade prod with a non-existing image tag **without** `--atomic`. What is the release status? What is the state of the pods?
2. Roll back.
3. Repeat with `--atomic --wait --timeout 90s`. What's different?

### Step 5: History
1. Do 5 upgrades. Show `helm history`.
2. Roll back to revision 2. What revision number does the rollback create?
3. Limit history to 3 revisions with `--history-max`. Verify by counting the Helm Secrets.

### Step 6: Decode a release
Decode the latest release Secret and print the values stored in it (`base64 -d | base64 -d | gunzip`).

## Challenge Exercise

1. Write a `deploy.sh <env> <image-tag>` script used by CI that validates input, lints, diffs, and deploys atomically.
2. Use `helmfile` to describe all 3 environments in one `helmfile.yaml` and `helmfile apply`.

## Deliverables
Values files, `deploy.sh`, answers.
