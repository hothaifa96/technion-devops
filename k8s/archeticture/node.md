# Kubernetes Node

## What is a Node?

A Node is a physical or virtual machine in the Kubernetes cluster that runs Pods. Each Node is managed by the Control Plane and contains the services necessary to run containers.

---

## Types of Nodes

| Type | Role | Description |
|------|------|-------------|
| Master Node | Control Plane | Manages the cluster, schedules workloads |
| Worker Node | Data Plane | Runs application Pods |

---

## Worker Node Components

```
┌─────────────────────────────────────────────┐
│                WORKER NODE                  │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │              kubelet                │    │
│  │  - Registers node with API Server  │    │
│  │  - Watches for Pod assignments     │    │
│  │  - Starts/stops containers         │    │
│  │  - Reports node and Pod status     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │            kube-proxy               │    │
│  │  - Maintains network rules         │    │
│  │  - Enables Service communication   │    │
│  │  - Implements iptables/IPVS rules  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │       Container Runtime (CRI)       │    │
│  │  - Pulls container images          │    │
│  │  - Runs containers                 │    │
│  │  - containerd / CRI-O             │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  Pod A   │ │  Pod B   │ │  Pod C   │    │
│  │┌────────┐│ │┌────────┐│ │┌────────┐│    │
│  ││Container││ ││Container││ ││Container││    │
│  │└────────┘│ │└────────┘│ │└────────┘│    │
│  └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────┘
```

---

## kubelet

The primary agent that runs on every node.

| Responsibility | Description |
|----------------|-------------|
| Pod management | Starts, stops, and monitors containers |
| Node registration | Registers node with the API Server |
| Health reporting | Reports node and Pod status to the Control Plane |
| Volume mounting | Mounts storage volumes for Pods |
| Probe execution | Runs liveness, readiness, and startup probes |

---

## kube-proxy

Handles networking on the node.

| Responsibility | Description |
|----------------|-------------|
| Service routing | Routes traffic to the correct Pod |
| Load balancing | Distributes traffic across Pod replicas |
| iptables/IPVS | Maintains network rules for Service IPs |

### Modes

| Mode | Description |
|------|-------------|
| iptables | Default, uses Linux iptables rules |
| IPVS | Better performance for large clusters |
| userspace | Legacy, rarely used |

---

## Container Runtime

The software that runs containers on the node.

| Runtime | Description |
|---------|-------------|
| containerd | Default runtime, lightweight, industry standard |
| CRI-O | Built for Kubernetes, OCI-compliant |
| Docker | Deprecated as runtime in K8s 1.24+ (containerd used instead) |

---

## Master Node (Control Plane) Components

```
┌─────────────────────────────────────────────┐
│              MASTER NODE                    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │           API Server                │    │
│  │  - RESTful API for all operations  │    │
│  │  - Authentication & Authorization  │    │
│  │  - Only component that talks to    │    │
│  │    etcd directly                   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │              etcd                   │    │
│  │  - Distributed key-value store     │    │
│  │  - Stores all cluster state        │    │
│  │  - Source of truth for the cluster │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │           Scheduler                 │    │
│  │  - Watches for unscheduled Pods    │    │
│  │  - Selects best node based on:     │    │
│  │    resources, affinity, taints     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │      Controller Manager             │    │
│  │  - Node Controller                 │    │
│  │  - ReplicaSet Controller           │    │
│  │  - Deployment Controller           │    │
│  │  - Endpoint Controller             │    │
│  │  - ServiceAccount Controller       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │   Cloud Controller Manager          │    │
│  │  - Node management (cloud VMs)     │    │
│  │  - Load Balancer provisioning      │    │
│  │  - Storage volume provisioning     │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## API Server

| Feature | Description |
|---------|-------------|
| Role | Central management point of the cluster |
| Protocol | REST over HTTPS |
| Authentication | Certificates, tokens, OIDC |
| Authorization | RBAC, ABAC, Webhook |
| Communication | Only component that reads/writes to etcd |

---

## etcd

| Feature | Description |
|---------|-------------|
| Type | Distributed key-value store |
| Data | All cluster state (pods, services, secrets, configs) |
| Consensus | Raft protocol (requires odd number of nodes: 1, 3, 5) |
| Backup | Critical — always back up etcd |

```bash
# Backup etcd
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

---

## Scheduler

Decides which node a Pod runs on based on:

| Factor | Description |
|--------|-------------|
| Resource requests | CPU and memory available on nodes |
| Node selectors | Pod preferences for specific nodes |
| Taints & Tolerations | Nodes can repel certain Pods |
| Affinity rules | Pod/node affinity and anti-affinity |
| Priority | Higher-priority Pods scheduled first |

---

## Controller Manager

Runs background loops (controllers) that reconcile desired vs actual state.

| Controller | Watches | Actions |
|-----------|---------|---------|
| Node Controller | Nodes | Detects node failures |
| ReplicaSet Controller | ReplicaSets | Maintains Pod count |
| Deployment Controller | Deployments | Manages rollouts |
| Job Controller | Jobs | Tracks job completion |
| Endpoint Controller | Services/Pods | Updates endpoint objects |
| ServiceAccount Controller | Namespaces | Creates default SA |

---

## Node Conditions

```bash
kubectl describe node <node-name>
```

| Condition | Description |
|-----------|-------------|
| Ready | Node is healthy and ready to accept Pods |
| MemoryPressure | Node is running low on memory |
| DiskPressure | Node is running low on disk |
| PIDPressure | Too many processes on the node |
| NetworkUnavailable | Node network not configured |

---

## Taints and Tolerations

### Taint a node

```bash
kubectl taint nodes node1 key=value:NoSchedule
```

### Remove a taint

```bash
kubectl taint nodes node1 key=value:NoSchedule-
```

### Toleration in Pod spec

```yaml
spec:
  tolerations:
    - key: "key"
      operator: "Equal"
      value: "value"
      effect: "NoSchedule"
```

---

## Node Labels

```bash
# Add label
kubectl label nodes node1 disk=ssd

# Remove label
kubectl label nodes node1 disk-

# Use in Pod
spec:
  nodeSelector:
    disk: ssd
```

---

## Common kubectl Commands

```bash
kubectl get nodes
kubectl get nodes -o wide
kubectl describe node <node-name>
kubectl top node
kubectl cordon <node-name>       # mark unschedulable
kubectl uncordon <node-name>     # mark schedulable
kubectl drain <node-name>        # evict all pods, mark unschedulable
```

---
