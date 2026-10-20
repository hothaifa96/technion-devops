# Lab 08: Agents - Static, Docker & Kubernetes

## Objective

Run builds on the right executors: labeled static agents, Docker containers and ephemeral Kubernetes pods.

## Prerequisites

- Read [09-agents.md](../../materials/09-agents.md)
- Reference: [class-code/08-docker-agent](../../class-code/08-docker-agent), [class-code/09-k8s-agent](../../class-code/09-k8s-agent)

## Part A - Static agents
1. Create 2 inbound agents (`agent-py` label `python`, `agent-node` label `node`) as containers.
2. Write a pipeline with `agent none` where stage 1 runs on `python` and stage 2 on `node`. Print `NODE_NAME` in each.
3. Use `stash/unstash` to pass a file from stage 1 to stage 2. Why is it needed?

## Part B - Docker agents
1. Rewrite the pipeline so every stage uses `agent { docker { image ... } }` (python, node, golang).
2. Use `reuseNode true` in one of them - what changes in the workspace path?
3. Create `Dockerfile.ci` with `jq`, `helm`, `kubectl` and use `agent { dockerfile { ... } }`.
4. Use the Docker Pipeline DSL: `docker.build`, `.inside`, `docker.withRegistry` + `.push()`.

## Part C - Kubernetes agents
1. Install Jenkins on minikube with Helm (`jenkins/jenkins` chart).
2. Verify the Kubernetes cloud is configured (Manage Jenkins → Clouds).
3. Write a pipeline with a pod template: `python`, `kaniko`, `helm` containers.
4. Run tests in `python`, build & push with `kaniko` (docker config secret), deploy with `helm`.
5. While the build runs: `kubectl get pods -n jenkins -w`. What happens to the pod at the end?
6. Give the agent ServiceAccount the minimal RBAC to deploy to namespace `dev` only.

## Questions
1. Why is mounting `/var/run/docker.sock` into Jenkins risky?
2. Why can't you run `docker build` inside a normal K8s pod agent?
3. Static vs Docker vs K8s agents - pros/cons table.

## Deliverables
Jenkinsfiles, pod template, RBAC YAML, answers.
