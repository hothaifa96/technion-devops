# Lab 2: Rolling Update, Rollback and History

## Objective

Update a Deployment to a new image, observe the rolling update, extract information about old and new ReplicaSets, and roll back to the previous version.

## Exercise

### Step 1 — Create the first version

Create a file named `web-deployment.yml`:

- Namespace: `deployment-lab`
- Name: `web-deployment`
- Replicas: `2`
- Image: `nginx:1.25`
- Container name: `web`
- Container port: `80`
- Labels: `app: web`

Apply it and wait until both pods are running.

### Step 2 — Extract initial data

Run these commands and write down the outputs:

1. `kubectl get deployment web-deployment -n deployment-lab -o jsonpath='{.spec.template.spec.containers[0].image}'`
   - What image is the Deployment using?

2. `kubectl get replicasets -n deployment-lab`
   - How many ReplicaSets belong to `web-deployment`? Note the name of the current one.

3. `kubectl rollout history deployment/web-deployment -n deployment-lab`
   - How many revisions are there?

### Step 3 — Perform a rolling update

Update the image to `nginx:1.27` in one of these ways (pick one):

- Edit `web-deployment.yml` and change the image, then `kubectl apply -f web-deployment.yml`
- Or run `kubectl set image deployment/web-deployment web=nginx:1.27 -n deployment-lab`

Watch the rollout:

```bash
kubectl rollout status deployment/web-deployment -n deployment-lab
```

While it is rolling, open a second terminal and run:

```bash
kubectl get pods -n deployment-lab -w
```

### Step 4 — Extract data after the update

Run the following and compare with the data from Step 2:

1. `kubectl get deployment web-deployment -n deployment-lab -o jsonpath='{.spec.template.spec.containers[0].image}'`
2. `kubectl get replicasets -n deployment-lab`
   - Can you see the old ReplicaSet? What is its scale (`DESIRED`, `CURRENT`)?
3. `kubectl get pods -n deployment-lab`
   - Are the pod names different from the original ones?
4. `kubectl rollout history deployment/web-deployment -n deployment-lab`
   - How many revisions now? Which one is the active one?

### Step 5 — Roll back

Undo the last rollout:

```bash
kubectl rollout undo deployment/web-deployment -n deployment-lab
```

Wait until it finishes, then run:

```bash
kubectl get deployment web-deployment -n deployment-lab -o jsonpath='{.spec.template.spec.containers[0].image}'
```

- Is the image back to `nginx:1.25`?

Run `kubectl get replicasets -n deployment-lab` and `kubectl rollout history deployment/web-deployment -n deployment-lab` again. What changed?

### Step 6 — Clean up

Delete the Deployment and the ReplicaSets it created:

```bash
kubectl delete -f web-deployment.yml
```

## Challenge

Perform three different image updates so the rollout history has at least three revisions. Then roll back to the **first** revision explicitly using `kubectl rollout undo deployment/web-deployment --to-revision=1 -n deployment-lab`.
