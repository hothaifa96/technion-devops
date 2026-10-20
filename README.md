# DevOps Course - Technion

Every topic follows the same layout:

```
<topic>/
├── materials/    # theory (md) - read before/after class
├── class-code/   # demos shown live in class
└── labs/         # homework labs, one per sub-topic
```

| Topic | Index | Sub-topics |
|-------|-------|-----------|
| Docker | [docker/README.md](docker/README.md) | Dockerfile, docker run, volumes, networks, multi-stage, buildx, best practices, compose |
| Kubernetes | [k8s/README.md](k8s/README.md) | control plane, worker node, workloads, probes & resources, scheduling, services/ingress/netpol, ConfigMap/Secret, storage, RBAC & pod security, jobs, HPA |
| Helm | [helm/README.md](helm/README.md) | public charts, chart structure, templating, release lifecycle & environments, umbrella charts, hooks & tests, OCI & GitOps |
| Jenkins CI/CD | [jenkins/README.md](jenkins/README.md) | architecture, declarative syntax, env & credentials, parameters & triggers, when/input, parallel & matrix, post/retry/timeout, agents (docker/k8s), artifacts & junit, shared libraries, multibranch, full CI/CD |
| Observability | [observability/README.md](observability/README.md) | Prometheus architecture, metric types, Python client, PromQL, exporters, service discovery/pushgateway/federation/Kubernetes, alerting, Grafana, logs & traces |
| Games | [games/README.md](games/README.md) | Jeopardy per topic, Quiz Show, Spot-the-Bug, Terminal Challenge, original [devops-jeopardy](devops-jeopardy) |
| Projects | [projects](projects) | final project catalog |

Play the games:

```bash
python3 -m http.server 8000
open http://localhost:8000/games/
```
