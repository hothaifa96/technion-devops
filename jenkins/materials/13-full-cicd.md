# Full CI/CD Pipeline: Docker → Registry → Kubernetes / Helm

```
 ┌──────────┐  webhook  ┌───────────────────────────── Jenkins ─────────────────────────────────────────┐
 │  GitHub  │ ────────▶ │ checkout → lint+unit (parallel) → build image → scan → push → deploy → smoke │
 └──────────┘           └───────────────────────────────────────────┬───────────────────────────────────┘
                                                                     │ helm upgrade --install --atomic
                                                       ┌─────────────▼─────────────┐
                                                       │ Kubernetes (dev/stg/prod) │
                                                       └───────────────────────────┘
```

---

## Reference Jenkinsfile

See [class-code/13-full-cicd/Jenkinsfile](../class-code/13-full-cicd/Jenkinsfile).

```groovy
pipeline {
    agent any
    options { timeout(time: 30, unit: 'MINUTES'); timestamps(); disableConcurrentBuilds() }
    environment {
        IMAGE     = 'myuser/jokes'
        TAG       = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        DOCKERHUB = credentials('dockerhub-creds')
    }
    stages {
        stage('Quality') {
            parallel {
                stage('Lint') { agent { docker { image 'python:3.12-slim' } } steps { sh 'pip install flake8 && flake8 app' } }
                stage('Unit') { agent { docker { image 'python:3.12-slim' } } steps { sh 'pip install -r app/requirements.txt pytest && pytest --junitxml=reports/unit.xml' } }
            }
        }
        stage('Build image') { steps { sh 'docker build -t $IMAGE:$TAG app' } }
        stage('Scan')        { steps { sh 'trivy image --exit-code 1 --severity CRITICAL $IMAGE:$TAG' } }
        stage('Push')        { steps { sh 'echo $DOCKERHUB_PSW | docker login -u $DOCKERHUB_USR --password-stdin && docker push $IMAGE:$TAG' } }
        stage('Deploy dev')  {
            when { branch 'main' }
            steps {
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh 'helm upgrade --install jokes chart -n dev --create-namespace --set image.tag=$TAG --atomic --wait'
                    sh 'helm test jokes -n dev'
                }
            }
        }
    }
    post { always { sh 'docker logout || true' } }
}
```

---

## Building images inside Kubernetes agents

No Docker daemon in pods → use:

| Tool | Notes |
|------|-------|
| **Kaniko** | builds from Dockerfile in userspace, pushes to registry |
| **BuildKit (rootless)** | `buildctl` with a buildkitd sidecar |
| **Buildah** | daemonless, OCI |
| DinD | privileged Docker-in-Docker (avoid) |

---

## Deployment approaches

| Approach | How |
|----------|-----|
| `kubectl apply` / `kubectl set image` | simple, imperative |
| `helm upgrade --install --atomic` | versioned releases, rollback |
| **GitOps** | Jenkins only updates the image tag in a deploy repo → Argo CD / Flux syncs |

### GitOps step

```groovy
stage('Update GitOps repo') {
    steps {
        sshagent(['gitops-key']) {
            sh '''
              git clone git@github.com:org/deploy.git && cd deploy
              yq -i ".image.tag = \\"$TAG\\"" envs/dev/values.yaml
              git commit -am "jokes: $TAG" && git push
            '''
        }
    }
}
```

---

## Promotion

Build **once**, promote the **same image** through environments:

```
build → myuser/jokes:42-ab12cd3 → dev → staging → (approval) → prod
```
