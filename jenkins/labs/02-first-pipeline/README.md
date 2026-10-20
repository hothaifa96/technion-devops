# Lab 02: Declarative Pipeline - Build, Run & Test a Container

## Objective

Write a declarative Jenkinsfile that builds a Docker image, runs it and tests it (like `jenkins/classcode/pipeline-1`).

## Prerequisites

- Lab 01 done
- Read [03-declarative-syntax.md](../../materials/03-declarative-syntax.md)

## Exercise

Use the Flask app from [docker/labs/01-dockerfile/starter](../../../docker/labs/01-dockerfile/starter) (with your Dockerfile).

Write a `Jenkinsfile` with:

1. `options`: `timestamps()`, `timeout(15 min)`, keep last 10 builds, no concurrent builds.
2. `environment`: `IMAGE_NAME`, `IMAGE_TAG = BUILD_NUMBER`, `CONTAINER_NAME`.
3. Stages:
   - **Info** - print `BUILD_NUMBER`, `JOB_NAME`, `WORKSPACE`, git commit (`returnStdout`)
   - **Build** - `docker build -t $IMAGE_NAME:$IMAGE_TAG <dir>`
   - **Run** - run the container on the `jenkins-net` network in the background
   - **Test** - `curl` `/quote` and `/health` using the container name (hint: Jenkins is on the same network)
   - **Report** - write the curl output to `report.txt` with `writeFile` / shell redirect
4. `post`:
   - `always`: remove the container and the image
   - `success`: archive `report.txt`
   - `failure`: print the container logs before removal

## Questions
1. What is the difference between `sh 'echo $IMAGE_TAG'` and `sh "echo ${IMAGE_TAG}"`?
2. Why does `curl localhost:5000` fail from inside the Jenkins container while `curl <container-name>:5000` works?
3. What happens if two builds run at the same time with the same `CONTAINER_NAME`? How did you prevent it?

## Challenge Exercise

1. Add a stage that runs a load test with `hey` or `ab` in a container and fails the build if p95 > 200ms.
2. Set `currentBuild.description` to the image tag.

## Deliverables
`Jenkinsfile` + answers.
