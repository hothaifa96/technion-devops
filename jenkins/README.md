# Jenkins CI/CD

```
jenkins/
├── materials/     # theory
├── class-code/    # demo Jenkinsfiles per topic (+ local Jenkins setup)
├── labs/          # homework labs
├── classcode/     # (git submodule) pipeline-1 used live in class
└── chuck-norris/  # full sample project (app + tests + k8s deployment)
```

| # | Topic | Material | Class Code | Lab |
|---|-------|----------|------------|-----|
| 01 | CI/CD, Jenkins architecture, installation | [01](materials/01-intro-architecture.md) | [00-setup](class-code/00-setup) | [01-setup](labs/01-setup) |
| 02 | Job types, declarative vs scripted | [02](materials/02-job-types.md) | [01-hello](class-code/01-hello), [12-scripted](class-code/12-scripted) | [01-setup](labs/01-setup) |
| 03 | Declarative syntax: agent, stages, steps, options | [03](materials/03-declarative-syntax.md) | [01-hello](class-code/01-hello) | [02-first-pipeline](labs/02-first-pipeline) |
| 04 | Environment variables & credentials | [04](materials/04-environment-credentials.md) | [02-env-credentials](class-code/02-env-credentials) | [03-env-credentials](labs/03-env-credentials) |
| 05 | Parameters & triggers | [05](materials/05-parameters-triggers.md) | [03-parameters-triggers](class-code/03-parameters-triggers) | [04-parameters](labs/04-parameters) |
| 06 | when, input, conditions | [06](materials/06-when-input.md) | [04-when-input](class-code/04-when-input) | [05-when-input](labs/05-when-input) |
| 07 | Parallel & matrix | [07](materials/07-parallel-matrix.md) | [05-parallel](class-code/05-parallel), [06-matrix](class-code/06-matrix) | [06-parallel-matrix](labs/06-parallel-matrix) |
| 08 | post, retry, timeout, error handling | [08](materials/08-post-error-handling.md) | [07-post-error-handling](class-code/07-post-error-handling) | [07-error-handling](labs/07-error-handling) |
| 09 | Agents: labels, docker, kubernetes | [09](materials/09-agents.md) | [08-docker-agent](class-code/08-docker-agent), [09-k8s-agent](class-code/09-k8s-agent) | [08-agents](labs/08-agents) |
| 10 | Artifacts, stash, test reports | [10](materials/10-artifacts-tests.md) | [10-artifacts-junit](class-code/10-artifacts-junit) | [09-artifacts-tests](labs/09-artifacts-tests) |
| 11 | Shared libraries | [11](materials/11-shared-libraries.md) | [11-shared-library](class-code/11-shared-library) | [10-shared-library](labs/10-shared-library) |
| 12 | Multibranch, webhooks, Git flow | [12](materials/12-multibranch-webhooks.md) | [13-full-cicd](class-code/13-full-cicd) | [11-multibranch](labs/11-multibranch) |
| 13 | Full CI/CD: Docker → registry → K8s/Helm | [13](materials/13-full-cicd.md) | [13-full-cicd](class-code/13-full-cicd) | [12-final-cicd](labs/12-final-cicd) |
| 14 | Best practices & security | [14](materials/14-best-practices.md) | - | - |

Cheatsheet: [materials/cheatsheet.md](materials/cheatsheet.md)
