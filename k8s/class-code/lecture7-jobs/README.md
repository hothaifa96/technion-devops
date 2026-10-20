# Lecture 7 - Jobs & CronJobs

```bash
kubectl apply -f job.yml
kubectl get jobs,pods -w
kubectl logs job/pi | head -c 200

kubectl apply -f parallel-job.yml
kubectl get pods -l job-name=image-resizer -w      # max 3 running
kubectl logs -l job-name=image-resizer --prefix

kubectl apply -f failing-job.yml
kubectl get pods -l job-name=flaky -w             # retries 10s, 20s, 40s...
kubectl describe job flaky | tail

kubectl apply -f cronjob.yml
kubectl get cj
kubectl get jobs -w
kubectl create job manual-run --from=cronjob/heartbeat   # trigger now
kubectl patch cj heartbeat -p '{"spec":{"suspend":true}}'

kubectl delete -f .
```
