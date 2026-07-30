# Deployment

## What is a Deployment?

A Deployment provides declarative updates for Pods and ReplicaSets. It manages the creation, scaling, and updating of Pods. It is the most common way to deploy applications in Kubernetes.

---

## Key Concepts

- Manages ReplicaSets automatically
- Supports rolling updates and rollbacks
- Maintains desired state declaratively
- Tracks revision history

---

## Basic Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: app
          image: nginx:1.21
          ports:
            - containerPort: 80
```

---

## Deployment with Full Options

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: app
          image: nginx:1.21
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "250m"
              memory: "256Mi"
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
```

---

## Update Strategies

| Strategy | Description |
|----------|-------------|
| RollingUpdate | Gradually replaces old Pods with new ones (default) |
| Recreate | Kills all old Pods before creating new ones |

### RollingUpdate Parameters

| Parameter | Description |
|-----------|-------------|
| maxSurge | Max Pods above desired count during update |
| maxUnavailable | Max Pods that can be unavailable during update |

---

## Rolling Update

```bash
kubectl set image deployment/my-deployment app=nginx:1.22
```

Or update the YAML and apply:

```bash
kubectl apply -f deployment.yaml
```

---

## Rollback

```bash
kubectl rollout undo deployment/my-deployment
kubectl rollout undo deployment/my-deployment --to-revision=2
```

---

## Check Rollout Status

```bash
kubectl rollout status deployment/my-deployment
kubectl rollout history deployment/my-deployment
```

---

## Scaling

```bash
kubectl scale deployment my-deployment --replicas=5
```

---

## Pause and Resume

```bash
kubectl rollout pause deployment/my-deployment
kubectl rollout resume deployment/my-deployment
```

---

## Common kubectl Commands

```bash
kubectl apply -f deployment.yaml
kubectl get deployments
kubectl describe deployment my-deployment
kubectl delete deployment my-deployment
kubectl get rs                          # see managed ReplicaSets
kubectl rollout status deployment/my-deployment
kubectl rollout history deployment/my-deployment
```

---
