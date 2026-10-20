# Control Plane (Master) Deep Dive

> Overview diagrams: [../../archeticture/cluster.md](../../archeticture/cluster.md) and [../../archeticture/node.md](../../archeticture/node.md)

The control plane is the **brain** of the cluster. It stores the desired state and continuously works to make the actual state match it (reconciliation loop).

```
                    ┌──────────────────── CONTROL PLANE ────────────────────┐
 kubectl ──HTTPS──▶ │  kube-apiserver  ◀──▶  etcd                           │
                    │       ▲   ▲                                           │
                    │       │   └──── kube-scheduler (watch unscheduled pods)│
                    │       └──────── kube-controller-manager (controllers) │
                    │       └──────── cloud-controller-manager (LB, nodes)  │
                    └───────┬───────────────────────────────────────────────┘
                            │ watch / status
               ┌────────────┴────────────┐
           kubelet (node 1)          kubelet (node 2)
```

---

## kube-apiserver

- The **only** component that talks to etcd
- Front door of the cluster: REST API over HTTPS (port 6443)
- Every request passes: **Authentication -> Authorization (RBAC) -> Admission Controllers -> Validation -> etcd**
- Stateless - can be scaled horizontally behind a load balancer

```
request ─▶ AuthN (certs/tokens/OIDC) ─▶ AuthZ (RBAC) ─▶ Mutating admission ─▶ Schema validation ─▶ Validating admission ─▶ etcd
```

```bash
kubectl get --raw /healthz
kubectl api-resources
kubectl api-versions
kubectl get pods -v=8        # see the HTTP calls kubectl makes
```

---

## etcd

- Distributed, consistent **key-value store** (Raft consensus)
- Holds **all** cluster state: objects, secrets, config
- Run an odd number of members (3 or 5) for quorum
- **Back it up!** If etcd is lost, the cluster is lost

```bash
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# keys are stored under /registry/<resource>/<namespace>/<name>
etcdctl get /registry/pods/default/nginx --prefix --keys-only
```

| Members | Quorum | Tolerated failures |
|---------|--------|-------------------|
| 1 | 1 | 0 |
| 3 | 2 | 1 |
| 5 | 3 | 2 |

---

## kube-scheduler

Watches for Pods with no `spec.nodeName` and picks the best node.

1. **Filtering** - remove nodes that can't run the pod (resources, nodeSelector, taints, affinity, ports)
2. **Scoring** - rank remaining nodes (spread, least allocated, image locality)
3. **Binding** - writes `nodeName` to the pod through the API server

If no node fits -> Pod stays `Pending` (`kubectl describe pod` shows `FailedScheduling`).

---

## kube-controller-manager

A single binary running many **controllers**, each a control loop:

```
loop forever:
    desired = read spec from API server
    actual  = observe status
    if actual != desired: act
```

| Controller | Job |
|------------|-----|
| Deployment | Manages ReplicaSets for rollouts |
| ReplicaSet | Keeps N pods running |
| Node | Detects unhealthy nodes, evicts pods |
| Job / CronJob | Runs pods to completion / on schedule |
| Endpoints / EndpointSlice | Links Services to Pod IPs |
| ServiceAccount | Creates default SA per namespace |
| Namespace | Cleans up deleted namespaces |

---

## cloud-controller-manager

Integrates with the cloud provider (EKS/GKE/AKS):
- `Service type: LoadBalancer` -> creates a cloud LB
- Node lifecycle (deleted VM -> delete Node)
- Routes

---

## What happens on `kubectl apply -f deployment.yaml`?

```
1. kubectl          -> POST Deployment to API server
2. API server       -> authN, authZ, admission, store in etcd
3. Deployment ctrl  -> sees new Deployment, creates ReplicaSet
4. ReplicaSet ctrl  -> sees RS wants 3 pods, creates 3 Pods (no node yet)
5. Scheduler        -> assigns each Pod a node (binding)
6. kubelet          -> sees Pod assigned to its node, asks container runtime to pull & run
7. kubelet          -> reports status Running back to API server
8. EndpointSlice    -> adds Pod IPs to matching Services
9. kube-proxy       -> updates iptables/IPVS rules on every node
```

---

## Where do the control plane components run?

On kubeadm / minikube clusters they are **static pods** defined in `/etc/kubernetes/manifests` on the control plane node, managed directly by the kubelet:

```bash
kubectl get pods -n kube-system
minikube ssh -- sudo ls /etc/kubernetes/manifests
# etcd.yaml  kube-apiserver.yaml  kube-controller-manager.yaml  kube-scheduler.yaml
```

On managed Kubernetes (EKS, GKE, AKS) the control plane is hidden and operated by the cloud provider.

---

## High Availability

- 3+ control plane nodes
- API servers behind a load balancer
- etcd stacked (on CP nodes) or external
- Scheduler & controller-manager use **leader election** (only one active)
