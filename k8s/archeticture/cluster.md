# Kubernetes Cluster Architecture

## What is a Cluster?

A Kubernetes cluster is a set of machines (nodes) that run containerized applications managed by Kubernetes. A cluster consists of a **Control Plane** (master) and one or more **Worker Nodes**.

---

## Cluster Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        KUBERNETES CLUSTER                          │
│                                                                     │
│  ┌───────────────────────────────────────┐                         │
│  │          CONTROL PLANE (Master)       │                         │
│  │                                       │                         │
│  │  ┌─────────────┐  ┌───────────────┐  │                         │
│  │  │  API Server  │  │   Scheduler   │  │                         │
│  │  └─────────────┘  └───────────────┘  │                         │
│  │  ┌─────────────┐  ┌───────────────┐  │                         │
│  │  │    etcd      │  │  Controller   │  │                         │
│  │  │              │  │   Manager     │  │                         │
│  │  └─────────────┘  └───────────────┘  │                         │
│  │  ┌─────────────────────────────────┐  │                         │
│  │  │   Cloud Controller Manager      │  │                         │
│  │  └─────────────────────────────────┘  │                         │
│  └───────────────────────────────────────┘                         │
│                         │                                           │
│                    API Requests                                     │
│                         │                                           │
│       ┌─────────────────┼─────────────────┐                        │
│       ▼                 ▼                 ▼                        │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                   │
│  │ Worker   │     │ Worker   │     │ Worker   │                   │
│  │ Node 1   │     │ Node 2   │     │ Node 3   │                   │
│  │          │     │          │     │          │                   │
│  │ ┌──────┐ │     │ ┌──────┐ │     │ ┌──────┐ │                   │
│  │ │kublet│ │     │ │kublet│ │     │ │kublet│ │                   │
│  │ └──────┘ │     │ └──────┘ │     │ └──────┘ │                   │
│  │ ┌──────┐ │     │ ┌──────┐ │     │ ┌──────┐ │                   │
│  │ │kube- │ │     │ │kube- │ │     │ │kube- │ │                   │
│  │ │proxy │ │     │ │proxy │ │     │ │proxy │ │                   │
│  │ └──────┘ │     │ └──────┘ │     │ └──────┘ │                   │
│  │ ┌──────┐ │     │ ┌──────┐ │     │ ┌──────┐ │                   │
│  │ │ CRI  │ │     │ │ CRI  │ │     │ │ CRI  │ │                   │
│  │ └──────┘ │     │ └──────┘ │     │ └──────┘ │                   │
│  │          │     │          │     │          │                   │
│  │ [Pod]    │     │ [Pod]    │     │ [Pod]    │                   │
│  │ [Pod]    │     │ [Pod]    │     │ [Pod]    │                   │
│  └──────────┘     └──────────┘     └──────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cluster Components Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| API Server | Control Plane | Front door to the cluster, handles all REST requests |
| etcd | Control Plane | Key-value store, holds all cluster state |
| Scheduler | Control Plane | Assigns Pods to Nodes |
| Controller Manager | Control Plane | Runs controllers (ReplicaSet, Deployment, etc.) |
| Cloud Controller Manager | Control Plane | Integrates with cloud provider APIs |
| kubelet | Worker Node | Ensures containers are running in Pods |
| kube-proxy | Worker Node | Manages network rules and Service routing |
| Container Runtime (CRI) | Worker Node | Runs containers (containerd, CRI-O) |

---

## How a Cluster Works

1. **User** sends a request via `kubectl` to the **API Server**
2. **API Server** validates and stores the request in **etcd**
3. **Scheduler** assigns the Pod to a suitable **Node**
4. **kubelet** on that Node pulls the image and starts the container
5. **kube-proxy** sets up networking so the Pod is reachable
6. **Controllers** continuously watch and reconcile desired vs actual state

---

## Single-Node vs Multi-Node Cluster

| Type | Description | Use Case |
|------|-------------|----------|
| Single-Node | Control plane and worker on same machine | Learning (minikube, k3s) |
| Multi-Node | Separate control plane and worker nodes | Production |
| Multi-Master | Multiple control plane nodes for HA | Production (high availability) |

---

## High Availability (HA) Cluster

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Master 1    │  │  Master 2    │  │  Master 3    │
│  API Server  │  │  API Server  │  │  API Server  │
│  etcd        │  │  etcd        │  │  etcd        │
│  Scheduler   │  │  Scheduler   │  │  Scheduler   │
│  Controller  │  │  Controller  │  │  Controller  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────┬───────┘─────────────────┘
                 │
          ┌──────┴──────┐
          │ Load Balancer│
          └──────┬──────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐ ┌────────┐ ┌────────┐
│Worker 1│ │Worker 2│ │Worker 3│
└────────┘ └────────┘ └────────┘
```

- Minimum 3 master nodes for HA (etcd requires odd number for quorum)
- Load Balancer distributes API requests across masters

---

## Cluster Networking

| Network | Purpose |
|---------|---------|
| Pod Network | Each Pod gets a unique IP (CNI: Calico, Flannel, Cilium) |
| Service Network | Virtual IPs for Services (managed by kube-proxy) |
| Node Network | Physical/VM network connecting nodes |

---

## Common Cluster Commands

```bash
# Cluster info
kubectl cluster-info

# List nodes
kubectl get nodes
kubectl get nodes -o wide

# Node details
kubectl describe node <node-name>

# Component status
kubectl get componentstatuses

# All resources in cluster
kubectl get all --all-namespaces
```

---
