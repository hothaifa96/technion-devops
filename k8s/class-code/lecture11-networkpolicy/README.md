# Lecture 11 - NetworkPolicy

Requires a CNI that enforces policies: `minikube start --cni=calico`

```bash
kubectl apply -f app.yml
kubectl -n netpol-demo rollout status deploy/backend

# before: everything is open
kubectl -n netpol-demo exec deploy/frontend -- curl -s -m 3 backend | head -2
kubectl -n netpol-demo exec deploy/attacker -- curl -s -m 3 backend | head -2

# apply policies step by step
kubectl apply -f policies.yml
kubectl -n netpol-demo get netpol

kubectl -n netpol-demo exec deploy/frontend -- curl -s -m 3 backend | head -2   # works
kubectl -n netpol-demo exec deploy/attacker -- curl -s -m 3 backend             # timeout
kubectl -n netpol-demo exec deploy/frontend -- curl -s -m 3 https://google.com  # blocked egress

kubectl delete ns netpol-demo
```
