# Artifacts, Stash & Test Reports

## archiveArtifacts - keep files with the build

```groovy
post {
    success {
        archiveArtifacts artifacts: 'dist/*.tar.gz, reports/**', fingerprint: true, allowEmptyArchive: false
    }
}
```

Downloadable from the build page. `fingerprint` tracks which builds produced/used a file.

---

## stash / unstash - move files between stages/agents (same build)

```groovy
stage('Build') {
    agent { label 'linux' }
    steps {
        sh 'make dist'
        stash name: 'dist', includes: 'dist/**'
    }
}
stage('Deploy') {
    agent { label 'deployer' }
    steps {
        unstash 'dist'
        sh 'ls dist'
    }
}
```

| | stash | archiveArtifacts |
|---|---|---|
| Lifetime | current build only | kept with the build |
| Purpose | move files between agents | deliverables / reports |
| Size | small-medium | any (prefer Nexus/Artifactory/S3 for large) |

---

## Test reports - JUnit

Most test tools can output JUnit XML:

| Tool | Flag |
|------|------|
| pytest | `pytest --junitxml=reports/junit.xml` |
| jest | `jest-junit` reporter |
| maven | surefire (default `target/surefire-reports/*.xml`) |
| go | `go test -v 2>&1 \| go-junit-report > report.xml` |

```groovy
post {
    always {
        junit testResults: 'reports/*.xml', allowEmptyResults: true
    }
}
```

- Failed tests → build **UNSTABLE** (yellow), not FAILURE (unless the command's exit code fails the step)
- Trend graph + per-test history on the job page

### Coverage & HTML reports

```groovy
recordCoverage(tools: [[parser: 'COBERTURA', pattern: 'coverage.xml']])   // Coverage plugin
publishHTML(target: [reportDir: 'htmlcov', reportFiles: 'index.html', reportName: 'Coverage'])
```

---

## Workspace hygiene

```groovy
options { skipDefaultCheckout() }   // checkout manually
post { cleanup { cleanWs() } }       // Workspace Cleanup plugin
deleteDir()                          // delete current dir
```

---

## Build metadata

```groovy
script {
    currentBuild.displayName = "#${BUILD_NUMBER} ${GIT_COMMIT.take(7)}"
    currentBuild.description = "Image: myuser/app:${BUILD_NUMBER}"
}
```
