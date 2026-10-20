# Lab 03: Environment Variables & Credentials - Push to Docker Hub

## Objective

Use built-in and custom variables, store secrets safely and push images to a registry.

## Prerequisites

- Docker Hub account + access token
- Read [04-environment-credentials.md](../../materials/04-environment-credentials.md)
- Reference: [class-code/02-env-credentials](../../class-code/02-env-credentials)

## Exercise

### Step 1: Variables
1. Open `http://localhost:8080/env-vars.html` and list 8 variables you find useful.
2. In a pipeline, define global `APP`, stage-level `STAGE_MSG`, and a runtime variable `GIT_SHORT` (via `env.` in `script`). Prove which ones are visible in which stage.

### Step 2: Credentials
Create:
- `dockerhub-creds` - username/password (token)
- `webhook-url` - secret text (use https://webhook.site)
- `app-env-file` - secret file with `DB_PASSWORD=...`

### Step 3: Push the image
Extend your lab 02 pipeline:
1. Tag the image as `<user>/quotes:${BUILD_NUMBER}` **and** `<user>/quotes:latest`.
2. Login with `credentials()` in `environment` and `--password-stdin`.
3. Push both tags. `docker logout` in `post { always }`.

### Step 4: withCredentials
1. Use `withCredentials` + `string` to `curl -X POST` the webhook with the build result.
2. Use `withCredentials` + `file` to run the container with `--env-file`.

### Step 5: Masking
1. Try `echo $DOCKERHUB_PSW` - what is printed?
2. Use `sh "echo ${DOCKERHUB_PSW}"` (double quotes). What warning does Jenkins print and why is it dangerous?

## Challenge Exercise

1. Create a **folder** `team-a` with folder-scoped credentials and show a job outside the folder cannot use them.
2. Use `sshagent` with an SSH key credential to run `docker ps` on a remote EC2 machine.

## Deliverables
Jenkinsfile, Docker Hub link, answers.
