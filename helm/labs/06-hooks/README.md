# Lab 06: Hooks & Tests

## Objective

Run database migrations, backups and smoke tests as part of the release lifecycle.

## Prerequisites

- Read [materials/06-hooks-tests.md](../../materials/06-hooks-tests.md)
- Reference: [class-code/05-hooks](../../class-code/05-hooks)

## Exercise

Use a chart with an app + PostgreSQL (dependency or your own StatefulSet).

### Step 1: pre-install / pre-upgrade migration
Write a Job hook that creates a table `visits` if it doesn't exist (`psql -c "CREATE TABLE IF NOT EXISTS ..."`). Weight `-5`.

### Step 2: pre-upgrade backup
Write a second `pre-upgrade` Job with weight `-10` that runs `pg_dump` to a PVC. Prove that backup runs **before** migration (`kubectl get jobs --sort-by=.metadata.creationTimestamp`).

### Step 3: post-install notification
A `post-install,post-upgrade` Job that `curl`s a webhook (use https://webhook.site) with the release name and revision.

### Step 4: Delete policies
1. Run the upgrade twice without `hook-delete-policy`. What error do you get?
2. Fix it with `before-hook-creation`. Then try `hook-succeeded`.

### Step 5: Failing hook
Make the migration fail. What is the release status? Were the Deployment changes applied?

### Step 6: helm test
Write 2 test pods:
- `test-http`: curl `/health` of the app
- `test-db`: `pg_isready` against the DB
Run `helm test <release> --logs`.

## Challenge Exercise

1. Add `helm test` as a stage in a Jenkins pipeline after `helm upgrade --install --wait`, and roll back automatically if it fails.
2. Explain why hook resources are not deleted on `helm uninstall` and how to clean them.

## Deliverables
Hook templates + test templates + outputs.
