# Lab 09: Artifacts, Stash & Test Reports

## Objective

Publish test results, coverage and build artifacts, and move files between stages.

## Prerequisites

- Read [10-artifacts-tests.md](../../materials/10-artifacts-tests.md)
- Reference: [class-code/10-artifacts-junit](../../class-code/10-artifacts-junit)

## Exercise

### Step 1: Tests
Add at least 5 pytest tests to the quotes app (use Flask `test_client()`).

### Step 2: JUnit
1. Run pytest with `--junitxml=reports/junit.xml` inside a Docker agent.
2. Publish with `junit` in `post { always }`.
3. Make one test fail. Is the build red or yellow? Why? What controls it?
4. Look at the **Test Result Trend** after 5 builds.

### Step 3: Coverage
1. Generate coverage with `pytest-cov` (XML + HTML).
2. Publish the HTML report with the HTML Publisher plugin.
3. Mark the build UNSTABLE if coverage < 80% (parse `coverage.xml` or use `--cov-fail-under=80` + `catchError`).

### Step 4: Artifacts
1. Package the app as `quotes-${BUILD_NUMBER}.tar.gz` + `SHA256SUMS`.
2. Archive them with `fingerprint: true`.
3. Download the artifact from the UI and verify the checksum.

### Step 5: Stash
Build the tarball on one agent, `stash` it, and in a `Deploy` stage on another agent `unstash` and "deploy" it (extract to `/tmp/deploy-${BUILD_NUMBER}`).

### Step 6: Cleanup
Use `cleanWs()` in `post { cleanup }`. Confirm the workspace is empty after the build.

## Challenge Exercise

1. Copy an artifact from another job with the `Copy Artifact` plugin.
2. Upload the artifact to S3 / Nexus instead of archiving in Jenkins.

## Deliverables
Jenkinsfile + screenshots of test trend, coverage report and artifacts.
