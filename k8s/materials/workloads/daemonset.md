# DaemonSet

## What is a DaemonSet?

A DaemonSet ensures that a copy of a Pod runs on all (or selected) nodes in the cluster. When a new node is added, the DaemonSet automatically deploys a Pod to it.

---

## Key Concepts

- One Pod per node (guaranteed)
- Automatically added to new nodes
- Automatically removed from deleted nodes
- Used for cluster-wide services

---

## Use Cases

- Log collectors (Fluentd, Filebeat)
- Monitoring agents (Prometheus Node Exporter, Datadog)
- Network plugins (Calico, Weave)
- Storage daemons (Ceph, GlusterFS)

---

## Basic DaemonSet YAML

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-collector
  labels:
    app: fluentd
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
        - name: fluentd
          image: fluentd:latest
          resources:
            requests:
              cpu: "100m"
              memory: "200Mi"
            limits:
              cpu: "200m"
              memory: "400Mi"
          volumeMounts:
            - name: varlog
              mountPath: /var/log
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
```

---

## DaemonSet on Specific Nodes

Use `nodeSelector` to target specific nodes.

```yaml
spec:
  template:
    spec:
      nodeSelector:
        disk: ssd
      containers:
        - name: app
          image: myapp
```

---

## DaemonSet with Tolerations

Run on master/control-plane nodes too.

```yaml
spec:
  template:
    spec:
      tolerations:
        - key: node-role.kubernetes.io/control-plane
          operator: Exists
          effect: NoSchedule
      containers:
        - name: monitoring
          image: node-exporter
```

---

## Common kubectl Commands

```bash
kubectl apply -f daemonset.yaml
kubectl get daemonsets
kubectl get ds
kubectl describe ds log-collector
kubectl delete ds log-collector
kubectl rollout status ds/log-collector
```

---
