# Declarative Pipeline Syntax

## Skeleton

```groovy
pipeline {
    agent any                       // where to run

    options { ... }                 // pipeline behaviour
    parameters { ... }              // build inputs
    triggers { ... }                // automatic start
    environment { ... }             // env variables
    tools { ... }                   // auto-installed tools (maven, jdk, nodejs)

    stages {
        stage('Build') {
            agent { ... }           // optional per-stage agent
            environment { ... }
            options { ... }
            when { ... }
            steps {
                sh 'echo build'
            }
            post { ... }
        }
    }

    post { ... }                    // after all stages
}
```

---

## Directives Reference

| Directive | Where | Example |
|-----------|-------|---------|
| `agent` | pipeline / stage | `agent any`, `agent none`, `agent { label 'linux' }`, `agent { docker { image 'node:20' } }` |
| `stages` / `stage` | pipeline | sequence of named stages |
| `steps` | stage | actual commands |
| `environment` | pipeline / stage | `APP = 'web'`, `TOKEN = credentials('id')` |
| `options` | pipeline / stage | `timeout`, `retry`, `timestamps`, `buildDiscarder`, `disableConcurrentBuilds`, `skipDefaultCheckout` |
| `parameters` | pipeline | `string`, `booleanParam`, `choice`, `password`, `text` |
| `triggers` | pipeline | `cron`, `pollSCM`, `upstream` |
| `tools` | pipeline / stage | `maven 'M3'`, `nodejs 'node20'` |
| `when` | stage | conditional stage |
| `input` | stage | wait for human approval |
| `parallel` | stage | run nested stages in parallel |
| `matrix` | stage | run stages for each combination of axes |
| `post` | pipeline / stage | `always`, `success`, `failure`, `unstable`, `changed`, `fixed`, `regression`, `aborted`, `cleanup` |

---

## Common steps

```groovy
steps {
    echo 'message'
    sh 'ls -la'                                   // Linux shell
    sh '''
        multi-line
        script
    '''
    bat 'dir'                                     // Windows
    script { def x = 5; if (x > 3) { echo 'big' } } // Groovy
    dir('app') { sh 'npm ci' }                    // change dir
    git url: 'https://github.com/org/repo.git', branch: 'main'
    checkout scm                                  // checkout the job repo
    writeFile file: 'out.txt', text: 'hello'
    def content = readFile 'out.txt'              // inside script {}
    archiveArtifacts artifacts: 'dist/**', fingerprint: true
    junit 'reports/*.xml'
    stash name: 'build', includes: 'dist/**'
    unstash 'build'
    sleep time: 10, unit: 'SECONDS'
    retry(3) { sh './flaky.sh' }
    timeout(time: 5, unit: 'MINUTES') { sh './long.sh' }
    error 'fail the build'
    unstable 'mark yellow'
    cleanWs()
}
```

### Capture shell output

```groovy
script {
    def commit = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    def rc     = sh(script: 'test -f README.md', returnStatus: true)
    env.GIT_SHORT = commit
}
```

---

## Groovy strings

```groovy
def name = 'world'
echo 'single quotes: ${name}'       // literal - NOT interpolated by Groovy
echo "double quotes: ${name}"       // Groovy interpolation
sh 'echo $HOME'                     // shell expands $HOME
sh "echo ${env.BUILD_NUMBER}"       // Groovy expands before shell
```

> For secrets use **single quotes** so the shell (not Groovy) expands them: `sh 'docker login -u $USER -p $PASS'`.

---

## Useful options

```groovy
options {
    timeout(time: 30, unit: 'MINUTES')
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
    skipStagesAfterUnstable()
    retry(2)
    ansiColor('xterm')
}
```
