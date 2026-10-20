# Lab 04: Parameters & Triggers

## Objective

Make pipelines reusable with parameters and start them automatically.

## Prerequisites

- Read [05-parameters-triggers.md](../../materials/05-parameters-triggers.md)
- Reference: [class-code/03-parameters-triggers](../../class-code/03-parameters-triggers)

## Exercise

### Step 1: Deploy job with parameters
Create a `deploy` pipeline with:
- `string IMAGE_TAG` (default `latest`)
- `choice ENV` (`dev`, `staging`, `prod`)
- `booleanParam SMOKE_TEST` (default true)
- `string REPLICAS` (default `1`)

It runs the image `<user>/quotes:$IMAGE_TAG` as a container named `quotes-$ENV` on port `5000/5001/5002` depending on ENV (use a Groovy map).

### Step 2: Validation
Fail the build with `error` if `ENV == prod` and `IMAGE_TAG == latest`.

### Step 3: Chain jobs
At the end of your lab 03 build pipeline, trigger `deploy` with `IMAGE_TAG=${BUILD_NUMBER}` and `ENV=dev` using the `build` step.

### Step 4: Cron
Add a nightly trigger to `deploy` (`H 2 * * *`). How does the job know it was triggered by a timer? (`currentBuild.getBuildCauses()`)

### Step 5: Remote trigger
1. Create an API token for your user.
2. Trigger `deploy` with `curl ... /buildWithParameters?ENV=staging&IMAGE_TAG=3`.

### Step 6: Webhook
1. Expose Jenkins with `ngrok http 8080`.
2. Configure a GitHub webhook to `<ngrok>/github-webhook/` and add `githubPush()` trigger. Push a commit - does the build start?

## Challenge Exercise

1. Use the `Active Choices` plugin to load the list of available tags from Docker Hub as a dynamic parameter.
2. Explain why `pollSCM` is worse than webhooks.

## Deliverables
Jenkinsfiles + curl command + screenshot of the webhook delivery.
