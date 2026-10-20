# post, retry, timeout & Error Handling

## Build results

| Result | Color | Cause |
|--------|-------|-------|
| SUCCESS | green | all good |
| UNSTABLE | yellow | tests failed (junit) / `unstable()` |
| FAILURE | red | a step failed / `error()` |
| ABORTED | grey | manually stopped / timeout |
| NOT_BUILT | grey | stage skipped / not executed |

---

## post conditions

```groovy
post {
    always   { echo 'runs every time' }
    success  { echo 'only on success' }
    failure  { echo 'only on failure' }
    unstable { echo 'tests failed' }
    aborted  { echo 'someone pressed stop / timeout' }
    changed  { echo 'status differs from previous build' }
    fixed    { echo 'previous failed, now success' }
    regression { echo 'previous success, now failed/unstable' }
    cleanup  { cleanWs() }   // runs LAST, after all others
}
```

`post` can be on the **pipeline** or on a **stage**.

### Notifications

```groovy
post {
    failure {
        mail to: 'team@example.com', subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}", body: "${env.BUILD_URL}"
        slackSend channel: '#ci', color: 'danger', message: "Build failed: ${env.BUILD_URL}"
    }
}
```

---

## timeout

```groovy
options { timeout(time: 20, unit: 'MINUTES') }        // whole pipeline
stage('Integration') {
    options { timeout(time: 5, unit: 'MINUTES') }      // single stage
    steps {
        timeout(time: 60, unit: 'SECONDS') {           // block
            sh './wait-for-service.sh'
        }
    }
}
```

## retry

```groovy
options { retry(2) }                // whole stage again
steps {
    retry(3) {                      // just this block
        sh 'curl -sf http://app:5000/health'
    }
}
```

### waitUntil (poll)

```groovy
timeout(time: 2, unit: 'MINUTES') {
    waitUntil(initialRecurrencePeriod: 2000) {
        script { sh(script: 'curl -sf http://app:5000/health', returnStatus: true) == 0 }
    }
}
```

---

## Controlled failure

```groovy
// fail the build
error 'Dockerfile missing'

// mark yellow and continue
unstable 'coverage below 80%'

// catch an error, set results, continue the pipeline
catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
    sh './optional-check.sh'
}

// mark stage only as unstable
warnError('lint failed') {
    sh 'flake8 .'
}

// classic try/catch/finally in script
script {
    try {
        sh './deploy.sh'
    } catch (err) {
        echo "deploy failed: ${err}"
        sh './rollback.sh'
        throw err            // re-throw to fail the build
    } finally {
        sh 'docker logout'
    }
}
```

### Ignore a command's exit code

```groovy
sh 'docker rm -f app || true'
def status = sh(script: './check.sh', returnStatus: true)
```

---

## currentBuild

```groovy
echo currentBuild.currentResult    // SUCCESS / UNSTABLE / FAILURE
echo currentBuild.result           // null while running successfully
currentBuild.displayName = "#${BUILD_NUMBER} - ${params.ENV}"
currentBuild.description = "image: ${IMAGE}:${TAG}"
echo currentBuild.previousBuild?.result
```
