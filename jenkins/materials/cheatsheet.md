# Jenkins CI/CD - Full Cheat Sheet

## Concepts

| Term            | Meaning                                                           |
| --------------- | ----------------------------------------------------------------- |
| Controller      | Jenkins server: UI, config, scheduling (0 executors recommended)  |
| Agent / Node    | machine/container/pod that runs builds                            |
| Executor        | build slot on an agent                                            |
| Label           | tag to select agents (`linux && docker`)                          |
| Workspace       | per-job checkout dir on the agent                                 |
| Job types       | Freestyle · Pipeline · Multibranch · Organization Folder · Folder |
| Pipeline styles | Declarative `pipeline {}` (recommended) · Scripted `node {}`      |
| Shared library  | reusable Groovy steps in a separate repo                          |

Run locally: `docker run -d -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts-jdk17` → password: `docker exec <c> cat /var/jenkins_home/secrets/initialAdminPassword`

---

## Declarative skeleton (all directives)

```groovy
@Library('devops-lib@v1.0.0') _              // optional shared library

pipeline {
    agent any                                // any | none | label | docker | dockerfile | kubernetes

    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '5'))
        disableConcurrentBuilds()
        skipDefaultCheckout()
        skipStagesAfterUnstable()
        parallelsAlwaysFailFast()
        retry(1)
        ansiColor('xterm')
        quietPeriod(5)
    }

    parameters {
        string(name: 'IMAGE_TAG', defaultValue: 'latest', description: 'tag')
        choice(name: 'ENV', choices: ['dev', 'staging', 'prod'])
        booleanParam(name: 'RUN_TESTS', defaultValue: true)
        text(name: 'NOTES', defaultValue: '')
        password(name: 'TOKEN', defaultValue: '')
    }

    triggers {
        cron('H 2 * * 1-5')
        pollSCM('H/5 * * * *')
        upstream(upstreamProjects: 'lib-build', threshold: hudson.model.Result.SUCCESS)
        // githubPush()   (GitHub plugin)
    }

    environment {
        APP   = 'jokes'
        IMAGE = "myuser/${APP}"
        TAG   = "${env.BUILD_NUMBER}"
        HUB   = credentials('dockerhub-creds')   // HUB_USR / HUB_PSW
    }

    tools { nodejs 'node20'; maven 'M3'; jdk 'jdk17' }

    stages {
        stage('Build') {
            steps { sh 'make build' }
        }
        stage('Test') {
            when { expression { params.RUN_TESTS } }
            parallel {
                stage('Unit') { steps { sh 'make unit' } }
                stage('Lint') { steps { sh 'make lint' } }
            }
        }
        stage('Deploy') {
            when { branch 'main' }
            input { message 'Deploy?'; ok 'Yes'; submitter 'admin' }
            steps { sh './deploy.sh $ENV' }
            post { failure { sh './rollback.sh' } }
        }
    }

    post {
        always   { junit allowEmptyResults: true, testResults: 'reports/*.xml' }
        success  { archiveArtifacts artifacts: 'dist/**', fingerprint: true }
        failure  { echo 'notify team' }
        cleanup  { cleanWs() }
    }
}
```

Rule: a `stage` contains exactly ONE of `steps` · `stages` · `parallel` · `matrix`.

---

## Agents

```groovy
agent any
agent none
agent { label 'linux && docker' }
agent { node { label 'linux'; customWorkspace '/tmp/ws' } }
agent { docker { image 'python:3.12-slim'; args '-u root -v /tmp/cache:/root/.cache'; reuseNode true; alwaysPull true } }
agent { dockerfile { filename 'Dockerfile.ci'; dir 'ci'; additionalBuildArgs '--build-arg X=1' } }
agent {
    kubernetes {
        yamlFile 'ci/pod.yaml'          // or yaml '''...'''
        defaultContainer 'python'
    }
}
// in steps: container('kaniko') { sh '...' }
```

Docker Pipeline DSL:

```groovy
script {
    def img = docker.build("myuser/app:${BUILD_NUMBER}", '--pull ./app')
    img.inside('-e CI=true') { sh 'pytest' }
    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-creds') {
        img.push(); img.push('latest')
    }
    docker.image('postgres:16').withRun('-e POSTGRES_PASSWORD=pw') { c -> sh "echo db is ${c.id}" }
}
```

---

## Steps reference

```groovy
echo 'msg'
sh 'cmd'                                    // bat 'cmd' / powershell 'cmd' on Windows
sh '''
   multi
   line
'''
sh '''#!/bin/bash
   set -euo pipefail
   echo bash features
'''
def out = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
def rc  = sh(script: 'test -f x', returnStatus: true)
script { /* groovy */ }
dir('sub') { sh 'ls' }
withEnv(['A=1', 'B=2']) { sh 'echo $A' }
checkout scm
git url: 'https://github.com/org/repo.git', branch: 'main', credentialsId: 'gh'
writeFile file: 'a.txt', text: 'hi'
def t = readFile 'a.txt'
fileExists 'Dockerfile'
readJSON file: 'x.json' / readYaml file: 'x.yaml' / writeJSON ...   // Pipeline Utility Steps
sleep time: 5, unit: 'SECONDS'
stash name: 'dist', includes: 'dist/**'; unstash 'dist'
archiveArtifacts artifacts: 'dist/*.tgz', fingerprint: true
junit 'reports/*.xml'
publishHTML(target: [reportDir: 'htmlcov', reportFiles: 'index.html', reportName: 'Coverage'])
build job: 'deploy', wait: false, parameters: [string(name: 'TAG', value: TAG)]
input message: 'Continue?', ok: 'Go'
mail to: 'team@x.com', subject: 'x', body: 'y'
cleanWs() / deleteDir()
error 'fail'   /   unstable 'warn'
```

---

## Environment variables

| Variable                                      | Example                              |
| --------------------------------------------- | ------------------------------------ |
| `BUILD_NUMBER`, `BUILD_ID`                    | 42                                   |
| `BUILD_URL`                                   | http://jenkins/job/app/42/           |
| `JOB_NAME`, `JOB_BASE_NAME`                   | app/main, main                       |
| `WORKSPACE`                                   | /var/jenkins_home/workspace/app_main |
| `NODE_NAME`, `EXECUTOR_NUMBER`                | agent1, 0                            |
| `JENKINS_URL`                                 | http://jenkins:8080/                 |
| `GIT_COMMIT`, `GIT_BRANCH`, `GIT_URL`         | sha, origin/main                     |
| `BRANCH_NAME`                                 | main (multibranch)                   |
| `CHANGE_ID`, `CHANGE_TARGET`, `CHANGE_AUTHOR` | PR info                              |
| `TAG_NAME`                                    | v1.2.0                               |

```groovy
echo "${env.BUILD_NUMBER}"      // Groovy
sh 'echo $BUILD_NUMBER'         // shell
script { env.SHORT = env.GIT_COMMIT.take(7) }   // visible in later stages
```

Full list: `http://<jenkins>/env-vars.html`.

### Quotes

| Code             | Who expands `$X`         |
| ---------------- | ------------------------ |
| `sh 'echo $X'`   | shell (safe for secrets) |
| `sh "echo ${X}"` | Groovy before the shell  |
| `sh "echo \$X"`  | shell (escaped)          |

---

## Credentials

| Kind              | Binding                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------- |
| Username/password | `usernamePassword(credentialsId:'id', usernameVariable:'U', passwordVariable:'P')`      |
| Secret text       | `string(credentialsId:'id', variable:'TOKEN')`                                          |
| Secret file       | `file(credentialsId:'id', variable:'KUBECONFIG')`                                       |
| SSH key           | `sshUserPrivateKey(credentialsId:'id', keyFileVariable:'KEY', usernameVariable:'USER')` |
| Certificate       | `certificate(credentialsId:'id', keystoreVariable:'KS', passwordVariable:'KP')`         |

```groovy
environment { HUB = credentials('dockerhub-creds') }          // HUB_USR, HUB_PSW
withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'U', passwordVariable: 'P')]) {
    sh 'echo $P | docker login -u $U --password-stdin'
}
withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) { sh 'kubectl get pods' }
sshagent(['git-ssh']) { sh 'git push origin HEAD:main' }
```

---

## when conditions

```groovy
when { branch 'main' }
when { branch pattern: 'release/.*', comparator: 'REGEXP' }
when { buildingTag() }
when { tag 'v*' }
when { changeRequest() }                       // PR
when { changeRequest target: 'main' }
when { changeset 'frontend/**' }
when { environment name: 'ENV', value: 'prod' }
when { equals expected: 'prod', actual: params.ENV }
when { expression { params.RUN_TESTS && currentBuild.result == null } }
when { triggeredBy 'TimerTrigger' }            // | 'SCMTrigger' | cause: 'UserIdCause'
when { not { branch 'main' } }
when { allOf { branch 'main'; environment name: 'DEPLOY', value: 'true' } }
when { anyOf { branch 'main'; buildingTag() } }
when { beforeAgent true; beforeInput true; beforeOptions true; branch 'main' }
```

## input

```groovy
stage('Approve') {
    options { timeout(time: 1, unit: 'HOURS') }
    input {
        message 'Deploy to prod?'
        ok 'Ship it'
        submitter 'admin,release-managers'
        submitterParameter 'APPROVER'
        parameters { choice(name: 'STRATEGY', choices: ['rolling', 'canary']) }
    }
    steps { echo "${APPROVER} chose ${STRATEGY}" }
}
```

Use `agent none` at the top so no executor is held while waiting.

---

## parallel & matrix

```groovy
stage('Checks') {
    failFast true
    parallel {
        stage('Unit') { agent { docker { image 'python:3.12' } } steps { sh 'pytest' } }
        stage('Lint') { steps { sh 'flake8' } }
        stage('BE') {
            stages {
                stage('Build') { steps { sh 'make be' } }
                stage('Test')  { steps { sh 'make test-be' } }
            }
        }
    }
}

// dynamic
script {
    def branches = [:]
    ['auth', 'orders'].each { s -> branches[s] = { sh "make build-${s}" } }
    parallel branches
}

stage('Matrix') {
    matrix {
        axes {
            axis { name 'PY';  values '3.11', '3.12' }
            axis { name 'OS';  values 'linux', 'windows' }
        }
        excludes { exclude { axis { name 'PY'; values '3.11' }; axis { name 'OS'; values 'windows' } } }
        agent { docker { image "python:${PY}-slim" } }
        stages { stage('Test') { steps { sh 'pytest' } } }
    }
}
```

---

## post conditions & error handling

| Condition                                      | Runs when                                       |
| ---------------------------------------------- | ----------------------------------------------- |
| `always`                                       | always                                          |
| `success` / `failure` / `unstable` / `aborted` | by result                                       |
| `changed`                                      | result differs from previous                    |
| `fixed`                                        | previous failed/unstable → now success          |
| `regression`                                   | previous success → now failure/unstable/aborted |
| `unsuccessful`                                 | not success                                     |
| `notBuilt`                                     | NOT_BUILT                                       |
| `cleanup`                                      | last, after all others                          |

| Result    | Color  | Cause                                 |
| --------- | ------ | ------------------------------------- |
| SUCCESS   | green  |                                       |
| UNSTABLE  | yellow | test failures (`junit`), `unstable()` |
| FAILURE   | red    | failing step, `error()`               |
| ABORTED   | grey   | stop / timeout / input rejected       |
| NOT_BUILT | grey   | skipped                               |

```groovy
retry(3) { sh 'curl -sf http://app/health' }
timeout(time: 2, unit: 'MINUTES') { sh './long.sh' }
timeout(time: 1, unit: 'MINUTES') {
    waitUntil(initialRecurrencePeriod: 2000) { script { sh(script: 'curl -sf app/health', returnStatus: true) == 0 } }
}
catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') { sh './optional.sh' }
warnError('lint failed') { sh 'flake8' }
script {
    try { sh './deploy.sh' }
    catch (err) { sh './rollback.sh'; throw err }
    finally { sh 'docker logout || true' }
}
sh 'docker rm -f x || true'
currentBuild.result = 'UNSTABLE'
currentBuild.displayName = "#${BUILD_NUMBER} ${params.ENV}"
currentBuild.description = "image ${IMAGE}:${TAG}"
currentBuild.getBuildCauses()*.shortDescription
```

---

## Scripted pipeline equivalent

```groovy
properties([parameters([choice(name: 'ENV', choices: ['dev', 'prod'])]),
            pipelineTriggers([cron('H 2 * * *')])])
node('linux') {
    try {
        stage('Checkout') { checkout scm }
        stage('Test')     { parallel unit: { sh 'make unit' }, lint: { sh 'make lint' } }
        if (env.BRANCH_NAME == 'main') {
            stage('Deploy') { timeout(time: 5, unit: 'MINUTES') { sh './deploy.sh' } }
        }
    } catch (e) {
        currentBuild.result = 'FAILURE'; throw e
    } finally {
        junit allowEmptyResults: true, testResults: 'reports/*.xml'
        deleteDir()
    }
}
```

---

## Shared library

```
vars/buildImage.groovy        -> buildImage(image: 'x')        def call(Map cfg) { ... }
vars/buildImage.txt           -> help text
src/org/devops/Semver.groovy  -> import org.devops.Semver      class Semver implements Serializable
resources/tpl/deploy.yaml     -> libraryResource 'tpl/deploy.yaml'
```

```groovy
@Library('devops-lib') _                 // default version
@Library('devops-lib@v1.2.0') _          // pinned
@Library('devops-lib') import org.devops.Semver
library identifier: 'devops-lib@main', retriever: modernSCM([$class: 'GitSCMSource', remote: 'https://github.com/org/lib.git'])
```

Configure: Manage Jenkins → System → Global Pipeline Libraries.

---

## Multibranch & webhooks

| Branch type                | Typical pipeline                  |
| -------------------------- | --------------------------------- |
| PR (`changeRequest()`)     | build, test, lint, scan - no push |
| `main` / `develop`         | + push image, deploy dev/staging  |
| tag `v*` (`buildingTag()`) | + approval, deploy prod           |

Webhook URLs: GitHub `http://<jenkins>/github-webhook/` · GitLab `http://<jenkins>/project/<job>` · local: `ngrok http 8080`.

Trigger remotely:

```bash
curl -X POST -u user:API_TOKEN "http://jenkins:8080/job/deploy/buildWithParameters?ENV=staging&TAG=42"
curl -X POST "http://jenkins:8080/job/x/build?token=TRIGGER_TOKEN"
```

---

## Cron syntax

`MINUTE HOUR DOM MONTH DOW` · `H` = hashed spread.

| Expr                                     | Meaning       |
| ---------------------------------------- | ------------- |
| `H/15 * * * *`                           | every 15 min  |
| `H * * * *`                              | hourly        |
| `H 2 * * *`                              | nightly ~2am  |
| `H 8 * * 1-5`                            | weekdays ~8am |
| `@daily` `@hourly` `@midnight` `@weekly` | aliases       |

---

## Typical CI/CD stages

```groovy
stage('Lint & Unit')   { parallel { ... } }
stage('Build image')   { steps { sh 'docker build -t $IMAGE:$TAG .' } }
stage('Scan')          { steps { sh 'trivy image --exit-code 1 --severity CRITICAL $IMAGE:$TAG' } }
stage('Push')          { when { branch 'main' } steps { sh 'echo $HUB_PSW | docker login -u $HUB_USR --password-stdin && docker push $IMAGE:$TAG' } }
stage('Deploy dev')    { steps { withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                           sh 'helm upgrade --install app ./chart -n dev --set image.tag=$TAG --atomic --wait && helm test app -n dev' } } }
stage('Promote prod')  { when { buildingTag() } input { message 'Prod?' } steps { ... } }
```

---

## Admin & CLI

```bash
# Jenkins CLI
java -jar jenkins-cli.jar -s http://localhost:8080 -auth user:token who-am-i
java -jar jenkins-cli.jar -s ... build deploy -p ENV=dev -f
java -jar jenkins-cli.jar -s ... safe-restart
# validate a Jenkinsfile
curl -X POST -u user:token -F "jenkinsfile=<Jenkinsfile" http://localhost:8080/pipeline-model-converter/validate
# plugins in Docker image
jenkins-plugin-cli --plugin-file plugins.txt
```

Useful URLs: `/pipeline-syntax` (snippet generator) · `/directive-generator` · `/env-vars.html` · `/script` (script console) · `/restart` · `/safeRestart` · `/manage/configuration-as-code`.

---

## Best practices

- [ ] Jenkinsfile in Git, declarative, logic in scripts/Makefile
- [ ] `timeout` + `buildDiscarder` on every pipeline
- [ ] Fast feedback: lint/unit first, parallelize
- [ ] Docker/K8s agents for reproducible tools; 0 executors on controller
- [ ] Credentials plugin only, single quotes in `sh`, `--password-stdin`
- [ ] Build once, promote the same image; immutable tags (`$BUILD_NUMBER-$SHA`)
- [ ] `junit` + artifacts; `cleanWs()` + docker cleanup in `post`
- [ ] `agent none` for pipelines with `input`
- [ ] Shared libraries pinned to tags
- [ ] Keep plugins updated; back up `JENKINS_HOME`; JCasC

---

## Troubleshooting

| Problem                                                   | Fix                                                                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `docker: not found` / permission denied on docker.sock    | install docker CLI in Jenkins image, mount socket, group/permissions                     |
| `No such DSL method`                                      | plugin missing (Docker Pipeline, Pipeline Utility Steps...)                              |
| `Scripts not permitted to use method`                     | In-process Script Approval / move to shared library                                      |
| Parameters not shown                                      | run the pipeline once to register them                                                   |
| Stage `when` ignored                                      | multibranch vars (`BRANCH_NAME`) only exist in multibranch jobs                          |
| Secret printed / warning about interpolation              | use single quotes                                                                        |
| Build waits forever "Waiting for next available executor" | no agent with that label / executors busy / input holding executor                       |
| Workspace collisions in parallel                          | `dir()` / separate agents / `ws()`                                                       |
| `NotSerializableException`                                | wrap non-serializable code in `@NonCPS` method or avoid storing it in variables          |
| Webhook doesn't trigger                                   | URL with trailing `/github-webhook/`, reachable (ngrok), job configured for push trigger |
