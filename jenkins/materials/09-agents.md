# Agents: Labels, Docker & Kubernetes

## agent options

```groovy
agent any                              // any available executor
agent none                             // no global agent - each stage declares its own
agent { label 'linux && docker' }      // label expression
agent { node { label 'linux'; customWorkspace '/tmp/ws' } }
agent { docker { image 'python:3.12-slim'; args '-u root -v $HOME/.cache:/root/.cache' } }
agent { dockerfile { filename 'Dockerfile.ci'; dir 'ci' } }
agent { kubernetes { yamlFile 'ci/pod.yaml' } }
```

---

## Adding a static agent

1. Manage Jenkins → Nodes → New Node → *Permanent Agent*
2. Set: remote root dir (`/home/jenkins`), labels (`linux docker`), executors
3. Launch method:
   - **SSH** - controller connects to the agent (needs SSH credentials)
   - **Inbound (JNLP/WebSocket)** - agent connects to the controller (good behind NAT)

```bash
# inbound agent as a container
docker run -d --name agent1 --network jenkins-net \
  jenkins/inbound-agent \
  -url http://jenkins:8080 -secret <SECRET> -name agent1 -workDir /home/jenkins/agent
```

---

## Docker agent

Every stage runs inside a fresh container - tools versioned in code, no pollution of the agent.

```groovy
pipeline {
    agent none
    stages {
        stage('Python tests') {
            agent { docker { image 'python:3.12-slim' } }
            steps { sh 'pip install -r requirements.txt && pytest' }
        }
        stage('Node build') {
            agent { docker { image 'node:20-alpine'; reuseNode true } }
            steps { sh 'npm ci && npm run build' }
        }
    }
}
```

- Requires the **Docker Pipeline** plugin and Docker on the agent
- `reuseNode true` - run the container on the same node/workspace as the parent agent
- Workspace is mounted into the container automatically

### Docker Pipeline DSL

```groovy
script {
    def img = docker.build("myuser/app:${env.BUILD_NUMBER}", "./app")
    img.inside { sh 'pytest' }
    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-creds') {
        img.push()
        img.push('latest')
    }
}
```

---

## Kubernetes agent (ephemeral pods)

Kubernetes plugin creates a pod per build, runs the steps, deletes the pod.

```groovy
pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: python
      image: python:3.12-slim
      command: ["sleep"]
      args: ["infinity"]
    - name: kaniko
      image: gcr.io/kaniko-project/executor:debug
      command: ["sleep"]
      args: ["infinity"]
    - name: helm
      image: alpine/helm:3.15.4
      command: ["sleep"]
      args: ["infinity"]
'''
        }
    }
    stages {
        stage('Test')  { steps { container('python') { sh 'pytest' } } }
        stage('Build') { steps { container('kaniko') { sh '/kaniko/executor --context . --destination myuser/app:1.0' } } }
        stage('Deploy'){ steps { container('helm')   { sh 'helm upgrade --install app ./chart' } } }
    }
}
```

- The `jnlp` container (agent) is added automatically
- Containers in the pod share the workspace volume
- Install Jenkins itself on K8s with the official Helm chart: `helm install jenkins jenkins/jenkins`

---

## Choosing

| Agent type | Pros | Cons |
|------------|------|------|
| Static VM | simple, caches persist | snowflake, idle cost |
| Docker | clean & reproducible per stage | needs Docker on agent |
| Kubernetes pods | elastic, isolated, cheap | setup, cold start, no Docker daemon (use kaniko/buildkit) |
| Cloud (EC2 plugin) | auto-scale VMs | slower start |
