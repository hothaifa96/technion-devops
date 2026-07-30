# PersistentVolumeClaim (PVC)

## What is a PVC?

A PersistentVolumeClaim (PVC) is a request for storage by a user. It is similar to a Pod requesting CPU/memory — a PVC requests a specific size and access mode from available PersistentVolumes.

---

## Key Concepts

- User-level request for storage
- Binds to a matching PV (size and access mode)
- Once bound, the PVC is exclusively tied to that PV
- Pods reference PVCs to mount storage

---

## How PVC Binding Works

1. User creates a PVC with desired size and access mode
2. Kubernetes finds a matching PV (or dynamically provisions one)
3. PVC is bound to the PV
4. Pod mounts the PVC as a volume

---

## Basic PVC YAML

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

---

## PVC with StorageClass

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: standard
  resources:
    requests:
      storage: 10Gi
```

---

## Using PVC in a Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-storage
spec:
  containers:
    - name: app
      image: nginx
      volumeMounts:
        - name: storage
          mountPath: /data
  volumes:
    - name: storage
      persistentVolumeClaim:
        claimName: my-pvc
```

---

## Using PVC in a Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 1
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
          image: nginx
          volumeMounts:
            - name: storage
              mountPath: /data
      volumes:
        - name: storage
          persistentVolumeClaim:
            claimName: my-pvc
```

---

## PVC Status

| Status | Description |
|--------|-------------|
| Pending | No matching PV found |
| Bound | Successfully bound to a PV |
| Lost | Bound PV no longer exists |

---

## Common kubectl Commands

```bash
kubectl apply -f pvc.yaml
kubectl get pvc
kubectl describe pvc my-pvc
kubectl delete pvc my-pvc
```

---
