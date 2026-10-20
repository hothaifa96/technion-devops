#!/usr/bin/env bash
# Lecture 0 - Exploring the control plane & worker nodes (minikube).
# minikube start --nodes 2 -p arch-demo

# --- nodes ---
kubectl get nodes -o wide
kubectl describe node "$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')" | sed -n '/Conditions/,/Addresses/p'

# --- control plane components (static pods) ---
kubectl get pods -n kube-system -o wide
minikube ssh -p arch-demo -- sudo ls /etc/kubernetes/manifests
minikube ssh -p arch-demo -- sudo cat /etc/kubernetes/manifests/kube-scheduler.yaml | head -30

# static pod: delete it -> kubelet recreates it immediately
kubectl delete pod -n kube-system -l component=kube-scheduler
kubectl get pods -n kube-system -l component=kube-scheduler -w

# --- API server ---
kubectl cluster-info
kubectl get --raw='/readyz?verbose'
kubectl get pods -v=8 2>&1 | grep -E "GET|Response Status"
kubectl api-resources | head -20

# --- etcd: look at the raw data ---
kubectl run etcd-demo --image=nginx
kubectl exec -n kube-system etcd-arch-demo -- sh -c \
  "ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
   --cacert=/var/lib/minikube/certs/etcd/ca.crt \
   --cert=/var/lib/minikube/certs/etcd/server.crt \
   --key=/var/lib/minikube/certs/etcd/server.key \
   get /registry/pods/default/etcd-demo --keys-only"

# --- scheduler: watch Pending when nothing fits ---
kubectl apply -f too-big-pod.yml
kubectl get pod too-big
kubectl describe pod too-big | tail -5      # FailedScheduling: Insufficient cpu

# --- scheduler bypass: nodeName ---
kubectl apply -f manual-schedule.yml
kubectl get pod manual -o wide

# --- controller manager: self healing ---
kubectl create deployment heal --image=nginx --replicas=3
kubectl delete pod -l app=heal --wait=false
kubectl get pods -l app=heal -w

# --- events timeline of a deployment ---
kubectl get events --sort-by=.metadata.creationTimestamp | tail -20

# --- worker node: kubelet & container runtime ---
minikube ssh -p arch-demo -- systemctl status kubelet --no-pager | head -5
minikube ssh -p arch-demo -- sudo crictl ps | head
kubectl get ds -n kube-system                # kube-proxy runs on every node

# --- node maintenance ---
NODE=arch-demo-m02
kubectl cordon $NODE
kubectl drain $NODE --ignore-daemonsets --delete-emptydir-data
kubectl get pods -o wide
kubectl uncordon $NODE

# cleanup
kubectl delete pod etcd-demo too-big manual --ignore-not-found
kubectl delete deploy heal
