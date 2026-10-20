# Lab 1: Horizontal Pod Autoscaler

## Objective

Automatically scale a deployment based on CPU and memory.

## Prerequisites

- `minikube addons enable metrics-server`
- Read [hpa.md](../../materials/scaling/hpa.md)
- Reference code: [class-code/lecture5-hpa](../../class-code/lecture5-hpa)

## Exercise

### Step 1: Deploy
1. Deploy `registry.k8s.io/hpa-example` (php-apache) with `requests.cpu: 200m`, `limits.cpu: 500m`, and a Service on port 80.
2. Verify `kubectl top pods` works.

### Step 2: HPA
1. Create an HPA (YAML, `autoscaling/v2`) with min 1, max 10, target CPU 50%.
2. `kubectl get hpa -w` - what is the TARGETS column now?

### Step 3: Load
1. Generate load: `kubectl run load --rm -it --image=busybox:1.36 -- sh -c "while true; do wget -q -O- http://php-apache; done"`.
2. Watch the HPA and pods. How long until it scales up? To how many replicas?
3. Stop the load. How long until it scales down? Why is scale down slower?

### Step 4: Behaviour tuning
Add a `behavior` section: scale up at most 2 pods every 15 seconds, scale down stabilization window 60 seconds. Repeat the test.

### Step 5: Memory metric
Add a second metric: average memory utilization 70%. How does HPA decide with 2 metrics?

### Step 6: Without requests
Remove `resources.requests` and re-apply. What does the HPA show? Why?

## Challenge Exercise

1. Explain the HPA formula: `desiredReplicas = ceil(currentReplicas * currentMetric / targetMetric)` with an example.
2. Read about KEDA and give 2 examples of event-driven scaling (queue length, cron).
3. HPA vs VPA vs Cluster Autoscaler / Karpenter - who scales what?

## Deliverables
YAMLs + screenshots of `kubectl get hpa -w`.
