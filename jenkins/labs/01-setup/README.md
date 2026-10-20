# Lab 01: Install Jenkins & First Jobs

## Objective

Run Jenkins locally in Docker, understand the controller/agent model and create freestyle and pipeline jobs.

## Prerequisites

- Docker
- Read [01-intro-architecture.md](../../materials/01-intro-architecture.md) and [02-job-types.md](../../materials/02-job-types.md)

## Exercise

### Step 1: Install
1. Start Jenkins with [class-code/00-setup](../../class-code/00-setup) (`docker compose up -d --build`).
2. Unlock it, install suggested plugins, create an admin user.
3. Where is `JENKINS_HOME`? What is stored in it? (`docker exec jenkins ls /var/jenkins_home`)

### Step 2: Freestyle job
1. Create a freestyle job `hello-freestyle` with a shell build step that prints `whoami`, `hostname`, `docker ps`.
2. Add a build parameter `NAME` and print it.
3. Run it, look at the **Console Output** and the **workspace**.

### Step 3: Pipeline job (inline)
1. Create a pipeline job `hello-pipeline` and paste [01-hello/Jenkinsfile](../../class-code/01-hello/Jenkinsfile).
2. Run it. Look at the Stage View and the archived artifact.
3. Use **Replay** to add a new stage without editing the job.

### Step 4: Pipeline from SCM
1. Fork / push this repo to your GitHub.
2. Create a pipeline job that reads `jenkins/class-code/01-hello/Jenkinsfile` from SCM.
3. Change the Jenkinsfile in Git, run again - what changed?

### Step 5: Agents
1. Set the controller executors to `0`. What happens to your jobs?
2. Add an inbound agent `agent1` with labels `linux docker` (see 00-setup README) and run the job again.
3. Change the Jenkinsfile to `agent { label 'docker' }`.

### Step 6: Snippet generator
Open `<job>/pipeline-syntax` and generate the snippet for `archiveArtifacts` and for `withCredentials`.

## Challenge Exercise

1. Convert the freestyle job into a Jenkinsfile.
2. Back up `JENKINS_HOME` to a tar file with a throwaway container, delete the Jenkins container + volume, and restore it.

## Deliverables
Screenshots + Jenkinsfile + answers.
