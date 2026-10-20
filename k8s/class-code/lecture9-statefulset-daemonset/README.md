# Lecture 9 - StatefulSet & DaemonSet

```bash
# --- StatefulSet ---
kubectl apply -f statefulset.yml
kubectl get pods -l app=redis -w          # redis-0, then redis-1, then redis-2 (ordered)
kubectl get pvc                           # data-redis-0, data-redis-1, data-redis-2

# stable DNS
kubectl run dns --rm -it --image=busybox:1.36 -- nslookup redis-1.redis

# stable storage
kubectl exec redis-0 -- redis-cli set course devops
kubectl delete pod redis-0
kubectl get pods -l app=redis -w          # same name comes back
kubectl exec redis-0 -- redis-cli get course   # devops

# scale down/up -> reverse order, PVCs are kept
kubectl scale sts redis --replicas=1
kubectl get pvc

# --- DaemonSet ---
kubectl apply -f daemonset.yml
kubectl get ds node-agent
kubectl get pods -l app=node-agent -o wide   # one per node
kubectl logs -l app=node-agent --prefix

kubectl delete -f .
kubectl delete pvc -l app=redis
```
