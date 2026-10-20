# Worker Node Deep Dive

> Overview: [../../archeticture/node.md](../../archeticture/node.md)

Worker nodes (data plane) run the application Pods.

```
┌──────────────────────── WORKER NODE ─────────────────────────┐
│  kubelet ──CRI──▶ containerd ──▶ runc ──▶ containers         │
│  kube-proxy (iptables / IPVS rules for Services)             │
│  CNI plugin (Calico / Flannel / Cilium / AWS VPC CNI)        │
│  CSI node plugin (mount volumes)                             │
│                                                              │
│  ┌── Pod A ──────────┐   ┌── Pod B ──────────┐               │
│  │ pause │ app │ sidecar│ │ pause │ app       │               │
│  └───────────────────┘   └───────────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

---

## kubelet

- Agent on **every** node (also control plane nodes)
- Registers the node with the API server
- Watches Pods assigned to its node and makes them run via the **CRI**
- Runs **liveness / readiness / startup probes**
- Mounts volumes, injects ConfigMaps/Secrets
- Reports node & pod status, resource usage (cAdvisor built in)
- Evicts pods under node pressure (memory, disk)
- Manages **static pods** from `/etc/kubernetes/manifests`

```bash
systemctl status kubelet
journalctl -u kubelet -f
```

---

## Container Runtime (CRI)

| Runtime | Notes |
|---------|-------|
| containerd | Default in most distros & EKS |
| CRI-O | Red Hat / OpenShift |
| Docker Engine | Removed in 1.24 (dockershim). Docker *images* still work! |

```bash
crictl ps
crictl images
crictl logs <container-id>
```

---

## kube-proxy

Implements **Services**: watches Services & EndpointSlices and programs rules so traffic to a `ClusterIP` reaches a backend Pod.

| Mode | Notes |
|------|-------|
| iptables | Default, random backend selection |
| IPVS | Better for thousands of services |
| eBPF (Cilium) | Replaces kube-proxy entirely |

```bash
kubectl get ds kube-proxy -n kube-system
sudo iptables -t nat -L KUBE-SERVICES | head
```

---

## CNI - Container Network Interface

Gives every Pod an IP and makes the Kubernetes networking model work:
1. Every Pod gets its own IP
2. Pods can talk to all Pods on any node **without NAT**
3. Agents on a node can talk to all Pods on that node

---

## The pause container

Every Pod has a hidden `pause` container that holds the network namespace. App containers join it -> containers in a Pod share `localhost` and IP.

---

## Node status & conditions

```bash
kubectl get nodes -o wide
kubectl describe node <node>
kubectl top node
```

| Condition | Meaning |
|-----------|---------|
| Ready | kubelet healthy and ready for pods |
| MemoryPressure | low memory |
| DiskPressure | low disk |
| PIDPressure | too many processes |
| NetworkUnavailable | network not configured |

---

## Node maintenance

```bash
kubectl cordon node1          # no new pods
kubectl drain node1 --ignore-daemonsets --delete-emptydir-data   # evict pods
kubectl uncordon node1        # back to schedulable
```

Node not reporting for ~40s -> `NotReady`; after ~5 min pods are evicted and rescheduled.
