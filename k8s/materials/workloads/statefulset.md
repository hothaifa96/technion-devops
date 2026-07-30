# StatefulSet

## What is a StatefulSet?

A StatefulSet manages stateful applications. Unlike Deployments, it provides guarantees about the ordering and uniqueness of Pods. Each Pod gets a persistent identity that is maintained across rescheduling.

---

## Key Concepts

- Stable, unique network identifiers (pod-0, pod-1, pod-2)
- Stable, persistent storage per Pod
- Ordered deployment and scaling
- Ordered, graceful deletion and termination

---

## When to Use StatefulSet

- Databases (MySQL, PostgreSQL, MongoDB)
- Message queues (Kafka, RabbitMQ)
- Distributed systems (Elasticsearch, Zookeeper)
- Any app that needs stable identity or persistent storage

---

## StatefulSet vs Deployment

| Feature | Deployment | StatefulSet |
|---------|-----------|-------------|
| Pod names | Random (app-7d9f8) | Ordered (app-0, app-1) |
| Storage | Shared PVC | Unique PVC per Pod |
| Scaling | Parallel | Sequential |
| Network identity | None | Stable DNS per Pod |

---

## Basic StatefulSet YAML

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql-headless
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.0
          ports:
            - containerPort: 3306
          env:
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: password
          volumeMounts:
            - name: data
              mountPath: /var/lib/mysql
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: standard
        resources:
          requests:
            storage: 10Gi
```

---

## Headless Service (Required)

StatefulSets require a Headless Service for Pod DNS.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
spec:
  clusterIP: None
  selector:
    app: mysql
  ports:
    - port: 3306
      targetPort: 3306
```

---

## Pod DNS Names

Each Pod gets a DNS name:

```
<pod-name>.<headless-service>.<namespace>.svc.cluster.local
```

Example:
```
mysql-0.mysql-headless.default.svc.cluster.local
mysql-1.mysql-headless.default.svc.cluster.local
mysql-2.mysql-headless.default.svc.cluster.local
```

---

## volumeClaimTemplates

Each Pod gets its own PVC automatically.

```yaml
volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 5Gi
```

PVCs created: `data-mysql-0`, `data-mysql-1`, `data-mysql-2`

---

## Scaling

```bash
kubectl scale statefulset mysql --replicas=5
```

Pods are created in order: mysql-3, then mysql-4.

---

## Common kubectl Commands

```bash
kubectl apply -f statefulset.yaml
kubectl get statefulsets
kubectl get sts
kubectl describe sts mysql
kubectl delete sts mysql
kubectl rollout status sts/mysql
```

---
