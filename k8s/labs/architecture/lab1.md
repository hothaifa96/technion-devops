# Lab 1: Control Plane & Worker Node Exploration

## Objective

Understand what every control plane and worker node component does by observing and breaking them.

## Prerequisites

- minikube with 2 nodes: `minikube start --nodes 2 -p arch`
- Read [control-plane.md](../../materials/architecture/control-plane.md) and [worker-node.md](../../materials/architecture/worker-node.md)

## Exercise

### Step 1: Inventory

1. List all nodes with their internal IP, OS image, kernel and container runtime.
2. List all pods in `kube-system`. For each one write which component it is and whether it is a **static pod**, **Deployment** or **DaemonSet**.
3. SSH into the control plane node and list `/etc/kubernetes/manifests`.

### Step 2: API Server

1. Run `kubectl get pods -v=8`. What HTTP method and URL did kubectl call?
2. Use `kubectl proxy` and `curl localhost:8001/api/v1/namespaces/default/pods` to list pods without kubectl.
3. Which port does the API server listen on? Where are its certificates?

### Step 3: Scheduler

1. Stop the scheduler: on the control plane node move `kube-scheduler.yaml` out of `/etc/kubernetes/manifests`.
2. Create a deployment with 2 replicas. What is the pod status? Why?
3. Move the manifest back - what happens to the pods?

### Step 4: Controller Manager

1. Do the same with `kube-controller-manager.yaml`.
2. Create a deployment. Are the pods created? Is a ReplicaSet created? Explain which controller is missing.
3. Restore it.

### Step 5: etcd

1. Exec into the etcd pod and list all keys under `/registry/deployments`.
2. Take an etcd snapshot (`etcdctl snapshot save`) and check it with `etcdctl snapshot status`.

### Step 6: Worker node

1. SSH into the worker node and run `sudo crictl ps`. Find the `pause` containers - how many are there and why?
2. Check `journalctl -u kubelet` for the last pod start.
3. Drain the worker node. Where did the pods go? Uncordon it.

## Challenge Exercise

1. Write in your own words, step by step, everything that happens from `kubectl create deployment web --image=nginx --replicas=2` until the pods are `Running` (name every component).
2. Create your own **static pod** on the worker node by placing a manifest in its `/etc/kubernetes/manifests`. Try to `kubectl delete` it - what happens?
3. What happens to already-running pods if the API server is down? Test it by moving `kube-apiserver.yaml` out of the manifests folder, then curl a running pod from the node. Can you still create new pods? Explain.

## Deliverables

`answers.md` with outputs and explanations.
