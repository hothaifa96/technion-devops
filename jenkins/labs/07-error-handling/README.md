# Lab 07: post, retry, timeout & Error Handling

## Objective

Build robust pipelines that handle flaky steps, hanging commands and failures gracefully.

## Prerequisites

- Read [08-post-error-handling.md](../../materials/08-post-error-handling.md)
- Reference: [class-code/07-post-error-handling](../../class-code/07-post-error-handling)

## Exercise

### Step 1: post matrix
Write a pipeline with a `RESULT` choice parameter (`success`, `unstable`, `failure`, `abort`) and a `post` block with **all** conditions. Fill the table:

| RESULT | which post blocks ran (in order)? |
|--------|----------------------------------|
| success | |
| unstable | |
| failure | |
| abort | |

Run `success` after `failure` - which extra block ran? And `failure` after `success`?

### Step 2: retry & waitUntil
1. Start the app container, then wait until `/health` returns 200 using `waitUntil` inside a 60s `timeout`.
2. Add `retry(3)` around a `curl` to an endpoint that fails randomly.

### Step 3: timeout
1. Pipeline-level timeout 5 min, stage-level timeout 30s on a `sleep 60`. What's the result?
2. What is the difference between ABORTED and FAILURE in this case?

### Step 4: Continue on failure
1. A `lint` step should never fail the build but mark the stage red → `catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE')`.
2. A `coverage` check below 80% should mark the build UNSTABLE → `unstable()` / `warnError`.

### Step 5: Rollback
In a deploy stage, use `try/catch/finally`:
- try: deploy new container version
- catch: print error, re-deploy the previous version, re-throw
- finally: `docker logout`

### Step 6: Notifications
In `post { failure }` and `post { fixed }` send a message to a webhook (webhook.site / Slack) with job name, build number, URL and result.

## Challenge Exercise

Write a reusable function `withRollback(Closure deploy, Closure rollback)` in a `script` block and use it.

## Deliverables
Jenkinsfile + filled table.
