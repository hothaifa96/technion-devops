# Pod

## What is a Pod?

A Pod is the smallest deployable unit in Kubernetes. It represents a single instance of a running process in your cluster. A Pod can contain one or more containers that share storage, network, and a specification for how to run.

---

## Key Concepts

- Smallest unit in Kubernetes (not a container)
- Contains one or more containers
- All containers in a Pod share the same network namespace (same IP)
- Containers in a Pod share storage volumes
- Pods are ephemeral — they can be destroyed and recreated at any time

---

## Pod Lifecycle

| Phase     | Description                                    |
| --------- | ---------------------------------------------- |
| Pending   | Pod accepted but containers not yet created    |
| Running   | At least one container is running              |
| Succeeded | All containers terminated successfully         |
| Failed    | All containers terminated, at least one failed |
| Unknown   | State cannot be determined                     |

---

## Basic Pod YAML

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  labels:
    app: myapp
spec:
  containers:
    - name: my-container
      image: nginx:latest
      ports:
        - containerPort: 80
```

---

## Multi-Container Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-container-pod
spec:
  containers:
    - name: web
      image: nginx:latest
      ports:
        - containerPort: 80
    - name: sidecar
      image: busybox
      command: ["sh", "-c", "while true; do echo sidecar running; sleep 10; done"]
```

---

## Pod with Environment Variables

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: env-pod
spec:
  containers:
    - name: app
      image: nginx
      env:
        - name: APP_ENV
          value: "production"
        - name: APP_PORT
          value: "8080"
```

---

## Pod with Resource Limits

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: resource-pod
spec:
  containers:
    - name: app
      image: nginx
      resources:
        requests:
          memory: "64Mi"
          cpu: "250m"
        limits:
          memory: "128Mi"
          cpu: "500m"
```

---

## Pod with Volume Mount

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: volume-pod
spec:
  containers:
    - name: app
      image: nginx
      volumeMounts:
        - name: data
          mountPath: /usr/share/nginx/html
  volumes:
    - name: data
      emptyDir: {}
```

---

## Init Containers

Init containers run before the main containers start.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-pod
spec:
  initContainers:
    - name: init-db
      image: busybox
      command: ["sh", "-c", "until nc -z db-service 5432; do sleep 2; done"]
  containers:
    - name: app
      image: myapp:latest
```

---

## Liveness and Readiness Probes

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: probe-pod
spec:
  containers:
    - name: app
      image: myapp:latest
      livenessProbe:
        httpGet:
          path: /healthz
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        initialDelaySeconds: 3
        periodSeconds: 5
```

---

## Common kubectl Commands

```bash
kubectl apply -f pod.yaml
kubectl get pods
kubectl get pods -o wide
kubectl describe pod my-pod
kubectl logs my-pod
kubectl logs my-pod -c my-container   # multi-container pod
kubectl exec -it my-pod -- /bin/bash
kubectl delete pod my-pod
```

---

## Pod Restart Policies

| Policy    | Description              |
| --------- | ------------------------ |
| Always    | Always restart (default) |
| OnFailure | Restart only on failure  |
| Never     | Never restart            |

```yaml
spec:
  restartPolicy: OnFailure
```

---
