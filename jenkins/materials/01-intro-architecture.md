# CI/CD & Jenkins Architecture

## CI / CD / CD

| Term | Meaning |
|------|---------|
| **Continuous Integration** | Every push is automatically built and tested; integrate often (daily) |
| **Continuous Delivery** | Every green build is *deployable*; production deploy is a manual click |
| **Continuous Deployment** | Every green build is deployed to production automatically |

```
 code ─▶ commit ─▶ build ─▶ unit tests ─▶ static analysis ─▶ package (image) ─▶ push ─▶ deploy staging ─▶ e2e ─▶ deploy prod
 └──────────────── CI ─────────────────────────────────────────────┘└─────────── CD ──────────────────────────────┘
```

---

## What is Jenkins?

Open source automation server (Java), 1800+ plugins. Pipelines are written as code in a `Jenkinsfile` (Groovy DSL) stored in Git.

| Alternatives | |
|---|---|
| GitHub Actions | YAML, hosted runners, tight GitHub integration |
| GitLab CI | YAML, built into GitLab |
| CircleCI, Azure DevOps, Tekton, Argo Workflows | |

---

## Architecture

```
                    ┌───────────────────────────────┐
  Git webhook ────▶ │   Jenkins CONTROLLER          │
  Users (UI/API) ─▶ │  - UI, config, plugins        │
                    │  - schedules builds (queue)   │
                    │  - stores job history (JENKINS_HOME)
                    └──────┬────────────┬───────────┘
                     SSH / JNLP (inbound agent) / K8s
              ┌────────────▼──┐   ┌─────▼──────────┐   ┌──────────────────┐
              │ Agent linux   │   │ Agent docker   │   │ K8s pod agents   │
              │ label: linux  │   │ label: docker  │   │ (ephemeral)      │
              │ executors: 2  │   │                │   │                  │
              └───────────────┘   └────────────────┘   └──────────────────┘
```

| Term | Meaning |
|------|---------|
| **Controller** | the Jenkins server (formerly "master") |
| **Agent / Node** | machine that runs builds |
| **Executor** | a slot on an agent that runs one build at a time |
| **Label** | tag for agents (`linux`, `docker`, `gpu`) used to pick an agent |
| **Workspace** | directory on the agent where the job checks out code |
| **Job / Project** | a configured task |
| **Build** | a single execution of a job (`#42`) |
| **Plugin** | extends Jenkins (Git, Docker, Kubernetes, Credentials, Blue Ocean) |

> Best practice: **0 executors on the controller**, run builds on agents.

---

## Install Jenkins with Docker

```bash
docker network create jenkins-net
docker volume create jenkins_home

docker run -d --name jenkins --network jenkins-net \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts-jdk17

docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

See [class-code/00-setup](../class-code/00-setup) for a compose setup with Docker CLI inside Jenkins.

| Port | Use |
|------|-----|
| 8080 | Web UI |
| 50000 | Inbound agents (JNLP) |

---

## Must-have plugins

Pipeline, Git, GitHub Branch Source, Credentials Binding, Docker Pipeline, Kubernetes, Blue Ocean / Pipeline Stage View, JUnit, Timestamper, AnsiColor, Workspace Cleanup, Pipeline Utility Steps, Configuration as Code (JCasC).

---

## JENKINS_HOME

```
/var/jenkins_home
├── config.xml          # global config
├── jobs/<job>/builds/  # build history & logs
├── plugins/
├── secrets/            # encryption keys - back up securely!
├── credentials.xml
└── workspace/
```
