# Lab 12: Final - End-to-End CI/CD to Kubernetes

## Objective

Combine everything: Docker, Kubernetes, Helm and all Jenkins pipeline features into one production-like pipeline.

## Prerequisites

- All previous Jenkins labs, Helm labs
- Reference: [class-code/13-full-cicd](../../class-code/13-full-cicd), [chuck-norris](../../chuck-norris)

## Requirements

Your pipeline for the quotes (or chuck-norris jokes) app must:

| # | Feature | Jenkins concept |
|---|---------|-----------------|
| 1 | Triggered by GitHub webhook on every branch & PR | multibranch, webhooks |
| 2 | Lint, unit tests, Dockerfile lint, secret scan **in parallel** | `parallel`, docker agents |
| 3 | Unit tests on Python 3.11 and 3.12 | `matrix` |
| 4 | Test report + coverage published | `junit`, HTML publisher |
| 5 | Build image tagged `<build>-<sha7>` | `environment`, `script` |
| 6 | Run the container and smoke-test it with retries | `retry`, `waitUntil`, `timeout` |
| 7 | Trivy scan; fail on CRITICAL | error handling |
| 8 | Push to Docker Hub only from `main` / tags | `when`, credentials |
| 9 | Deploy to `dev` namespace with Helm `--atomic` + `helm test` | `withCredentials(file)` |
| 10 | Manual approval → deploy to `prod` on tags | `input`, `agent none` |
| 11 | Notify success / failure / fixed | `post` |
| 12 | At least 2 steps come from your shared library | `@Library` |
| 13 | Workspace & docker cleanup | `post { cleanup }` |

## Bonus
- Build in Kubernetes pod agents with Kaniko
- GitOps: instead of `helm upgrade`, update `image.tag` in a deploy repo and let Argo CD sync
- Observability: expose `/metrics` and add a ServiceMonitor in the chart

## Deliverables
1. Repo link with `Jenkinsfile`, `Dockerfile`, Helm chart
2. Screenshots: pipeline graph for a PR, for `main`, and for a tag
3. 1-page README with the pipeline diagram and design decisions
