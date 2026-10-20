# Parallel Stages & Matrix

## parallel

Run independent stages at the same time → faster feedback.

```groovy
stage('Tests') {
    parallel {
        stage('Unit') {
            steps { sh 'pytest tests/unit' }
        }
        stage('Lint') {
            steps { sh 'flake8 .' }
        }
        stage('Security') {
            agent { docker { image 'aquasec/trivy:latest' } }
            steps { sh 'trivy fs .' }
        }
    }
}
```

```
         ┌─ Unit ─────┐
Build ──▶├─ Lint ─────┤──▶ Deploy
         └─ Security ─┘
```

### failFast

```groovy
stage('Tests') {
    failFast true          // abort the other branches when one fails
    parallel { ... }
}
// or globally:
options { parallelsAlwaysFailFast() }
```

### Nested sequential stages inside a parallel branch

```groovy
parallel {
    stage('Backend') {
        stages {
            stage('Build BE') { steps { sh 'make be' } }
            stage('Test BE')  { steps { sh 'make test-be' } }
        }
    }
    stage('Frontend') {
        stages {
            stage('Build FE') { steps { sh 'npm run build' } }
            stage('Test FE')  { steps { sh 'npm test' } }
        }
    }
}
```

### Scripted / dynamic parallel

```groovy
script {
    def services = ['auth', 'orders', 'payments']
    def branches = [:]
    services.each { svc ->
        branches[svc] = {
            sh "docker build -t myorg/${svc}:${BUILD_NUMBER} services/${svc}"
        }
    }
    parallel branches
}
```

> Rules: a stage can have **only one** of `steps`, `stages`, `parallel`, `matrix`. Parallel branches share the same workspace if they run on the same agent - avoid writing the same files.

---

## matrix

Run the same stages for every combination of axes.

```groovy
stage('Matrix build') {
    matrix {
        axes {
            axis {
                name 'PYTHON'
                values '3.10', '3.11', '3.12'
            }
            axis {
                name 'OS'
                values 'linux', 'windows'
            }
        }
        excludes {
            exclude {
                axis { name 'OS';     values 'windows' }
                axis { name 'PYTHON'; values '3.10' }
            }
        }
        agent { docker { image "python:${PYTHON}-slim" } }
        stages {
            stage('Test') {
                steps { sh 'python --version && pip install -r requirements.txt && pytest' }
            }
        }
    }
}
```

3 × 2 − 1 excluded = **5 cells**, all run in parallel.

| Use matrix for | Example |
|----------------|---------|
| language versions | node 18/20/22 |
| platforms | linux/amd64, linux/arm64 |
| browsers | chrome, firefox, safari |
| environments | multiple regions |
