# ReplicaSet

## What is a ReplicaSet?

A ReplicaSet ensures that a specified number of Pod replicas are running at any given time. If a Pod fails or is deleted, the ReplicaSet automatically creates a new one to maintain the desired count.

---

## Key Concepts

- Maintains a stable set of replica Pods
- Uses label selectors to identify its Pods
- Automatically replaces failed Pods
- Usually managed by a Deployment (not created directly)

---

## ReplicaSet YAML

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: my-replicaset
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
          image: nginx:latest
          ports:
            - containerPort: 80
```

---

## YAML Breakdown

| Field | Description |
|-------|-------------|
| replicas | Number of desired Pod copies |
| selector.matchLabels | How the ReplicaSet finds its Pods |
| template | Pod template used to create new Pods |

---

## How It Works

1. ReplicaSet checks how many Pods match its selector
2. If fewer than `replicas` → creates new Pods
3. If more than `replicas` → deletes excess Pods
4. Continuously reconciles desired vs actual state

---

## Scaling

```bash
kubectl scale replicaset my-replicaset --replicas=5
```

---

## Common kubectl Commands

```bash
kubectl apply -f replicaset.yaml
kubectl get replicasets
kubectl get rs
kubectl describe rs my-replicaset
kubectl delete rs my-replicaset
```

---

## ReplicaSet vs Deployment

| Feature | ReplicaSet | Deployment |
|---------|-----------|------------|
| Rolling updates | No | Yes |
| Rollback | No | Yes |
| Declarative updates | No | Yes |
| Manages ReplicaSets | No | Yes |

> **Best Practice:** Always use Deployments instead of ReplicaSets directly. Deployments manage ReplicaSets for you.

---
