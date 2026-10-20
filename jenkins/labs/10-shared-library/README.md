# Lab 10: Shared Library

## Objective

Extract repeated pipeline logic into a versioned shared library used by multiple repos.

## Prerequisites

- Read [11-shared-libraries.md](../../materials/11-shared-libraries.md)
- Reference: [class-code/11-shared-library](../../class-code/11-shared-library)

## Exercise

### Step 1: Library repo
Create a GitHub repo `jenkins-shared-lib` with `vars/`, `src/`, `resources/`.

### Step 2: Steps (vars/)
Implement:
- `dockerBuildPush(image:, tag:, context:, push:)` → returns the full image ref
- `notifyWebhook(url:, status:)` → posts the build result
- `deployContainer(image:, name:, port:)` → `docker rm -f` + `docker run`
- A help file `vars/dockerBuildPush.txt`

### Step 3: Class (src/)
`org.<you>.Version` with `static String nextPatch(String v)` and `static String fromGit(script)` that returns `git describe --tags` (pass `this` to call `sh`).

### Step 4: Resource
`resources/k8s/deployment.yaml` template with placeholders; a step `renderManifest(app:, image:)` that writes it to the workspace.

### Step 5: Register & use
1. Configure the library as `devops-lib` (default version `main`).
2. Refactor your quotes Jenkinsfile to use only library steps. How many lines did you save?
3. Create a tag `v1.0.0` in the library and pin `@Library('devops-lib@v1.0.0') _`.

### Step 6: Pipeline template
Implement `vars/standardPythonPipeline.groovy` with the full declarative pipeline, so an app repo's Jenkinsfile is 2 lines.

## Challenge Exercise

1. Write unit tests for the library with JenkinsPipelineUnit.
2. Load the library dynamically with `library identifier: ..., retriever: modernSCM(...)`.

## Deliverables
Library repo link + refactored Jenkinsfile.
