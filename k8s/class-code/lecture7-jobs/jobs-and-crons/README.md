# Jobs & CronJobs in 3 languages

| Folder        | Language          | What it does                                            |
|---------------|-------------------|---------------------------------------------------------|
| `python/`     | Python + requests | counts completed todos for `USER_ID`                    |
| `javascript/` | Node.js (fetch)   | top `TOP` users by characters written in posts          |
| `bash/`       | bash + curl + jq  | lists users (name, email, city)                         |

All use the free API https://jsonplaceholder.typicode.com

## 1. Build the images inside minikube

```bash
eval $(minikube docker-env)          # build directly into minikube's docker
docker build -t jobs-python:1.0     python/
docker build -t jobs-javascript:1.0 javascript/
docker build -t jobs-bash:1.0       bash/
eval $(minikube docker-env -u)       # back to local docker
```
> Manifests use `imagePullPolicy: Never`, so the images must exist on the node.

## 2. Jobs

```bash
kubectl apply -f k8s/jobs.yml
kubectl get jobs,pods -w
kubectl logs job/python-job
kubectl logs job/javascript-job
kubectl logs job/bash-job
kubectl delete -f k8s/jobs.yml
```

## 3. CronJobs

```bash
kubectl apply -f k8s/cronjobs.yml
kubectl get cj
kubectl get jobs -w                                  # python every 1m, javascript every 2m
kubectl create job bash-now --from=cronjob/bash-cron # bash runs 08:00 Sun-Thu, trigger now
kubectl logs job/bash-now
kubectl patch cj python-cron -p '{"spec":{"suspend":true}}'
kubectl delete -f k8s/cronjobs.yml
```

## 4. Exercise - Job from a script in a ConfigMap

See [`exercise-configmap/README.md`](exercise-configmap/README.md).
