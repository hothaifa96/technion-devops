# Lecture 12 - Scheduling

```bash
minikube start --nodes 2 -p sched
kubectl label node sched-m02 disktype=ssd
kubectl taint node sched-m02 dedicated=db:NoSchedule

kubectl apply -f scheduling.yml
kubectl get pods -o wide
kubectl describe pod ssd-pod | tail -3    # untolerated taint -> Pending
kubectl get pods -l app=spread -o wide    # 2 running, 1 Pending

kubectl taint node sched-m02 dedicated=db:NoSchedule-
kubectl get pods -o wide                  # ssd-pod now scheduled

kubectl delete -f scheduling.yml
minikube delete -p sched
```
