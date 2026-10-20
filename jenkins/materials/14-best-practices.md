# Jenkins Best Practices & Security

## Pipelines

| # | Practice |
|---|----------|
| 1 | Pipeline as code (`Jenkinsfile` in the repo), declarative first |
| 2 | Keep logic in scripts/Makefile; Jenkinsfile orchestrates (`sh 'make test'`) |
| 3 | Fail fast: lint & unit tests first, parallelize independent work |
| 4 | Always set `timeout` and `buildDiscarder` |
| 5 | Use Docker/K8s agents for reproducible tool versions |
| 6 | Build once, promote the same artifact |
| 7 | Immutable tags (SHA / semver) |
| 8 | Publish test reports (`junit`) and archive only useful artifacts |
| 9 | Clean workspace (`cleanWs()`) and Docker leftovers in `post { always }` |
| 10 | Don't hold executors during `input` (use `agent none` at top) |
| 11 | Reuse with shared libraries, pin library versions |
| 12 | Avoid heavy Groovy logic on the controller (it runs in the controller JVM) |

## Security

| # | Practice |
|---|----------|
| 1 | 0 executors on the controller |
| 2 | Credentials plugin only; never hard-code secrets; single quotes in `sh` |
| 3 | Folder-scoped credentials per team |
| 4 | Role-Based Authorization Strategy / Matrix security; no anonymous access |
| 5 | Keep Jenkins & plugins updated, remove unused plugins |
| 6 | Don't build untrusted PRs with secrets (fork PR protection) |
| 7 | HTTPS in front of Jenkins (reverse proxy) |
| 8 | Back up `JENKINS_HOME` (including `secrets/`) |
| 9 | Mounting `docker.sock` = root on the host - isolate those agents |
| 10 | Configuration as Code (JCasC) - reproducible Jenkins |

## JCasC example

```yaml
# jenkins.yaml
jenkins:
  systemMessage: "Managed by JCasC"
  numExecutors: 0
  securityRealm:
    local:
      allowsSignup: false
      users:
        - id: admin
          password: ${ADMIN_PASSWORD}
credentials:
  system:
    domainCredentials:
      - credentials:
          - usernamePassword:
              id: dockerhub-creds
              username: myuser
              password: ${DOCKERHUB_TOKEN}
              scope: GLOBAL
```
