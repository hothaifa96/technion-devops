# HorizontalPodAutoscaler (HPA)

## What is HPA?

The HorizontalPodAutoscaler automatically scales the number of Pods in a Deployment, ReplicaSet, or StatefulSet based on observed CPU/memory utilization or custom metrics.

---

## Key Concepts

- Automatically increases or decreases Pod replicas
- Based on CPU, memory, or custom metrics
- Requires Metrics Server installed in the cluster
- Checks metrics every 15 seconds by default

---

## Install Metrics Server

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

---

## Create HPA from Command Line

```bash
kubectl autoscale deployment my-deployment --cpu-percent=70 --min=2 --max=10
```

---

## HPA YAML (CPU-based)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## HPA with Memory

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mem-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## HPA with Multiple Metrics

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: multi-metric-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-deployment
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 75
```

---

## Important: Resource Requests Required

HPA needs resource requests defined in the Deployment to calculate utilization.

```yaml
containers:
  - name: app
    image: myapp
    resources:
      requests:
        cpu: "200m"
        memory: "256Mi"
      limits:
        cpu: "500m"
        memory: "512Mi"
```

---

## Scaling Behavior

```yaml
spec:
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

---

## Common kubectl Commands

```bash
kubectl apply -f hpa.yaml
kubectl get hpa
kubectl describe hpa my-hpa
kubectl delete hpa my-hpa
kubectl top pods              # check current resource usage
kubectl top nodes
```

---
