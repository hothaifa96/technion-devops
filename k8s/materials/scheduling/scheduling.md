# Scheduling: nodeSelector, Affinity, Taints & Tolerations

## nodeSelector (simple)

```bash
kubectl label node worker-1 disktype=ssd
```
```yaml
spec:
  nodeSelector:
    disktype: ssd
```

---

## Node Affinity (expressive)

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:      # hard rule
        nodeSelectorTerms:
          - matchExpressions:
              - key: topology.kubernetes.io/zone
                operator: In
                values: [eu-west-1a, eu-west-1b]
      preferredDuringSchedulingIgnoredDuringExecution:     # soft rule
        - weight: 80
          preference:
            matchExpressions:
              - key: disktype
                operator: In
                values: [ssd]
```

Operators: `In`, `NotIn`, `Exists`, `DoesNotExist`, `Gt`, `Lt`.

---

## Pod Affinity / Anti-Affinity

```yaml
spec:
  affinity:
    podAntiAffinity:                # spread replicas on different nodes
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels: { app: web }
          topologyKey: kubernetes.io/hostname
    podAffinity:                    # run next to redis
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels: { app: redis }
            topologyKey: kubernetes.io/hostname
```

---

## Taints & Tolerations

Taint = node **repels** pods. Toleration = pod **allows** being scheduled on a tainted node (does not force it).

```bash
kubectl taint node gpu-1 gpu=true:NoSchedule
kubectl taint node gpu-1 gpu=true:NoSchedule-     # remove
```

```yaml
spec:
  tolerations:
    - key: gpu
      operator: Equal
      value: "true"
      effect: NoSchedule
```

| Effect | Meaning |
|--------|---------|
| `NoSchedule` | new pods without toleration are not scheduled |
| `PreferNoSchedule` | try to avoid |
| `NoExecute` | also evicts running pods without toleration |

> Control plane nodes have `node-role.kubernetes.io/control-plane:NoSchedule`.

**Dedicated nodes pattern** = taint (keep others out) + nodeAffinity (keep my pods in).

---

## Topology Spread Constraints

```yaml
spec:
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels: { app: web }
```

---

## Other

| Feature | Use |
|---------|-----|
| `nodeName` | bypass the scheduler (debug only) |
| `priorityClassName` | important pods preempt lower priority pods |
| PodDisruptionBudget | limit voluntary disruptions (`minAvailable: 2`) during drain |
