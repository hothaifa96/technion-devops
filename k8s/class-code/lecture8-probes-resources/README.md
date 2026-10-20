# Lecture 8 - Probes, Resources, QoS & Quotas

```bash
# --- probes ---
kubectl apply -f probes.yml
kubectl get pods -l app=probes-demo -w        # RESTARTS increases after ~30s
kubectl describe pod -l app=probes-demo | grep -A3 Liveness

# readiness: make one pod not-ready, watch it leave the endpoints
POD=$(kubectl get pod -l app=probes-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD -- rm /tmp/ready
kubectl get endpoints probes-demo -w
kubectl exec $POD -- touch /tmp/ready

# --- resources ---
kubectl apply -f oom.yml
kubectl get pod oom-demo -w                   # OOMKilled -> CrashLoopBackOff
kubectl get pod oom-demo -o jsonpath='{.status.containerStatuses[0].lastState}'
kubectl top pod cpu-demo                      # capped at ~200m
kubectl get pod cpu-demo -o jsonpath='{.status.qosClass}'

# --- LimitRange + ResourceQuota ---
kubectl apply -f quota.yml
kubectl -n team-a create deployment web --image=nginx --replicas=8
kubectl -n team-a get pods                    # only 5 created
kubectl -n team-a describe quota
kubectl -n team-a get rs -o wide; kubectl -n team-a describe rs | grep -i exceeded
kubectl -n team-a get pod -o jsonpath='{.items[0].spec.containers[0].resources}'   # defaults injected

kubectl delete -f .
```
