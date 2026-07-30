# Namespace

## What is a Namespace?

A Namespace is a virtual cluster within a Kubernetes cluster. It provides isolation and organization for resources, allowing multiple teams or projects to share a cluster.

---

## Key Concepts

- Logical separation of resources
- Resource quotas and limits per namespace
- RBAC policies scoped to namespaces
- Services can communicate across namespaces

---

## Default Namespaces

| Namespace | Description |
|-----------|-------------|
| default | Default namespace for resources with no namespace specified |
| kube-system | System components (DNS, scheduler, controller-manager) |
| kube-public | Publicly accessible resources |
| kube-node-lease | Node heartbeat information |

---

## Create Namespace

### Command line

```bash
kubectl create namespace dev
```

### YAML

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: dev
  labels:
    environment: development
```

---

## Deploy to a Namespace

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  namespace: dev
spec:
  containers:
    - name: app
      image: nginx
```

Or with kubectl:

```bash
kubectl apply -f pod.yaml -n dev
```

---

## Resource Quota

Limit resources per namespace.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: dev
spec:
  hard:
    pods: "10"
    requests.cpu: "4"
    requests.memory: "8Gi"
    limits.cpu: "8"
    limits.memory: "16Gi"
```

---

## Cross-Namespace Communication

```
<service-name>.<namespace>.svc.cluster.local
```

```bash
curl http://api-service.production.svc.cluster.local
```

---

## Common kubectl Commands

```bash
kubectl get namespaces
kubectl get ns
kubectl create namespace staging
kubectl delete namespace staging
kubectl get pods -n dev
kubectl get all -n kube-system
kubectl config set-context --current --namespace=dev   # switch default
```

---
