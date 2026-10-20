# Lab 1: Jobs & CronJobs

## Objective

Run batch workloads to completion, in parallel and on a schedule.

## Prerequisites

- Read [job.md](../../materials/workloads/job.md)

## Exercise

### Step 1: Simple Job
1. Write a Job `hello-job` using `busybox:1.36` that prints `Hello DevOps` and the date, then exits.
2. Check its status, completions and logs.
3. Why must `restartPolicy` be `Never` or `OnFailure`? Try `Always`.

### Step 2: Failure handling
1. Write a Job that always fails (`exit 1`) with `backoffLimit: 2`.
2. How many pods were created? What is the time between retries?
3. Change `restartPolicy` to `OnFailure`. How many pods now? Where do you see the retries?

### Step 3: Parallel processing
1. Write a Job that needs `completions: 8` with `parallelism: 4` and `completionMode: Indexed`.
2. Each pod prints `processing chunk $JOB_COMPLETION_INDEX` and sleeps 5 seconds.
3. Watch with `kubectl get pods -w` - how many run at once? Total duration?

### Step 4: Database backup CronJob
1. Deploy `postgres:16-alpine` (Deployment + Service + Secret with password).
2. Create a PVC `backups` (500Mi).
3. Write a CronJob that runs every 2 minutes and runs `pg_dump` into `/backups/db-$(date +%s).sql` on the PVC.
4. `concurrencyPolicy: Forbid`, keep 3 successful and 1 failed job.
5. After 6 minutes, list the backup files (hint: a debug pod mounting the PVC).

### Step 5: Manual trigger & suspend
1. Trigger the CronJob immediately with `kubectl create job --from=cronjob/...`.
2. Suspend the CronJob and verify no new jobs are created.

## Challenge Exercise

1. Add `ttlSecondsAfterFinished: 60` and `activeDeadlineSeconds: 30` to a job that sleeps 60s. What happens?
2. Use a `podFailurePolicy` to stop retrying when the container exits with code `42`.
3. Use the `timeZone` field to run a CronJob every day at 08:00 Israel time.

## Deliverables
YAML files and screenshots of the backup files.
