# Lab 1: Probes, Resources & Quotas

## Objective

Make applications self-healing and well behaved with probes, requests/limits, LimitRange and ResourceQuota.

## Prerequisites

- Read [probes.md](../../materials/workloads/probes.md) and [resources-qos.md](../../materials/workloads/resources-qos.md)
- `minikube addons enable metrics-server`

## Exercise

### Step 1: Liveness
1. Deploy `registry.k8s.io/e2e-test-images/agnhost:2.40` with args `["liveness"]` (the `/healthz` endpoint starts returning 500 after 10 seconds) on port 8080.
2. Add an HTTP liveness probe on `/healthz`.
3. Watch RESTARTS. Look at the Events in `kubectl describe`.

### Step 2: Readiness & zero downtime
1. Deploy a Flask app (3 replicas) that has `/ready` which returns 503 for the first 20 seconds after startup.
2. Add a readiness probe and a Service. While running `while true; do curl -s svc; done` from a pod, do a rolling update. Do you see errors?
3. Remove the readiness probe and repeat. Do you see errors now?

### Step 3: Startup probe
An app needs 60 seconds to start. Configure a `startupProbe` so the liveness probe (period 5s) does not kill it during startup.

### Step 4: Requests & limits
1. Deploy `polinux/stress` with a memory limit of 100Mi that allocates 200M. What happens? Exit code?
2. Deploy a CPU stress with limit `250m` and check `kubectl top pod`.
3. Request `cpu: 50` on a pod. What is its status and why?
4. Create 3 pods, one of each QoS class, and print their `qosClass`.

### Step 5: Namespace guard rails
1. Create namespace `dev` with a LimitRange (default request 100m/64Mi, limit 200m/128Mi).
2. Create a ResourceQuota: max 4 pods, 1 CPU requests, 1Gi memory limits.
3. Create a deployment with 6 replicas. How many pods are running? Where is the error message?

## Challenge Exercise

1. Write a PodDisruptionBudget `minAvailable: 2` for a 3-replica deployment and try to drain a node.
2. Explain why setting CPU limits can hurt latency and when you would skip them.

## Deliverables
YAMLs + answers.
