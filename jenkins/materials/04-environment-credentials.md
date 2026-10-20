# Environment Variables & Credentials

## Built-in environment variables

See all at `http://<jenkins>/env-vars.html`.

| Variable | Example |
|----------|---------|
| `BUILD_NUMBER` | `42` |
| `BUILD_ID` | `42` |
| `BUILD_URL` | `http://jenkins/job/app/42/` |
| `JOB_NAME` | `app/main` |
| `WORKSPACE` | `/var/jenkins_home/workspace/app_main` |
| `NODE_NAME` | `built-in`, `agent-1` |
| `BRANCH_NAME` | `main`, `feature/x` (multibranch) |
| `CHANGE_ID` | PR number (multibranch PR builds) |
| `GIT_COMMIT` | full SHA |
| `GIT_BRANCH` | `origin/main` |
| `TAG_NAME` | when building a tag |

```groovy
echo "Build ${env.BUILD_NUMBER} of ${env.JOB_NAME} on ${env.NODE_NAME}"
sh 'echo $BUILD_NUMBER'
```

---

## Defining variables

```groovy
pipeline {
    agent any
    environment {                         // global
        APP_NAME   = 'jokes'
        IMAGE      = "myuser/${APP_NAME}"
        IMAGE_TAG  = "${env.BUILD_NUMBER}"
    }
    stages {
        stage('Build') {
            environment { STAGE_VAR = 'only here' }   // stage scope
            steps {
                sh 'echo $IMAGE:$IMAGE_TAG $STAGE_VAR'
                script {
                    env.DYNAMIC = sh(script: 'date +%s', returnStdout: true).trim()  // set at runtime
                }
                withEnv(['TEMP_VAR=123']) { sh 'echo $TEMP_VAR' }                  // block scope
            }
        }
        stage('Next') {
            steps { echo "dynamic = ${env.DYNAMIC}" }
        }
    }
}
```

> `environment {}` values are strings. `env.X = ...` inside `script` is visible in later stages.

---

## Credentials

Stored encrypted in Jenkins (Manage Jenkins → Credentials). Scopes: **Global** / **System**, and per **Folder**.

| Kind | Use |
|------|-----|
| Username with password | Docker Hub, Git HTTPS |
| Secret text | API tokens, Slack webhook |
| Secret file | kubeconfig, service account JSON |
| SSH Username with private key | Git SSH, servers |
| Certificate | PKCS#12 |

### 1. `credentials()` helper in `environment`

```groovy
environment {
    DOCKERHUB = credentials('dockerhub-creds')   // username/password
    // creates: DOCKERHUB (user:pass), DOCKERHUB_USR, DOCKERHUB_PSW
    SLACK_TOKEN = credentials('slack-token')     // secret text
    KUBECONFIG  = credentials('kubeconfig-file') // secret file -> path to temp file
}
steps {
    sh 'echo $DOCKERHUB_PSW | docker login -u $DOCKERHUB_USR --password-stdin'
}
```

### 2. `withCredentials` block

```groovy
withCredentials([
    usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'USER', passwordVariable: 'PASS'),
    string(credentialsId: 'slack-token', variable: 'SLACK'),
    file(credentialsId: 'kubeconfig-file', variable: 'KUBECONFIG'),
    sshUserPrivateKey(credentialsId: 'ec2-key', keyFileVariable: 'KEY', usernameVariable: 'SSH_USER')
]) {
    sh 'echo $PASS | docker login -u $USER --password-stdin'
    sh 'kubectl get pods'
    sh 'ssh -i $KEY -o StrictHostKeyChecking=no $SSH_USER@10.0.0.5 uptime'
}
```

### 3. `sshagent`

```groovy
sshagent(['github-ssh-key']) {
    sh 'git push origin HEAD:main'
}
```

---

## Masking & safety

- Jenkins masks secrets in logs as `****`
- Use **single quotes** in `sh` so Groovy doesn't interpolate secrets (Jenkins warns: *"A secret was passed to sh using Groovy String interpolation"*)
- Never `echo` secrets, never write them to archived files
- Prefer short-lived credentials (OIDC, IAM roles for agents)
