# Lab 3: Labels, Selectors and Data Extraction


Create two Deployments with different labels, then use `kubectl` label selectors, `jsonpath`, and `custom-columns` to extract specific data. All answers must come from `kubectl` commands, not from the YAML files you wrote.

## Exercise

### Step 1 — Create the Deployments

Create two files:

**`web-deployment.yml`**

- Namespace: `deployment-lab`
- Name: `web-deployment`
- Replicas: `2`
- Image: `nginx:1.25`
- Labels: `app: web`, `tier: frontend`

**`api-deployment.yml`**

- Namespace: `deployment-lab`
- Name: `api-deployment`
- Replicas: `2`
- Image: `containous/whoami:v1.5.0`
- Labels: `app: api`, `tier: backend`

Apply both.

### Step 2 — Inspect with label selectors

Run each command and record the result:

1. `kubectl get pods -n deployment-lab --show-labels`
   - What labels does each pod have?

2. `kubectl get pods -n deployment-lab -l tier=frontend`
   - How many pods are selected? Why?

3. `kubectl get pods -n deployment-lab -l 'tier in (frontend, backend)'`
   - How many pods are selected?

4. `kubectl get all -n deployment-lab -l app=web`
   - Which objects are selected? (Deployment, ReplicaSet, Pods, ...)

### Step 3 — Extract data with jsonpath

Run these and write the output:

1. Print the names of all frontend pods:

   ```bash
   kubectl get pods -n deployment-lab -l app=web -o jsonpath='{.items[*].metadata.name}'
   ```

2. Print the image used by the `api` Deployment:

   ```bash
   kubectl get deployment api-deployment -n deployment-lab -o jsonpath='{.spec.template.spec.containers[0].image}'
   ```

3. Print the desired replica count for the `web` Deployment:

   ```bash
   kubectl get deployment web-deployment -n deployment-lab -o jsonpath='{.spec.replicas}'
   ```

4. Print the node name of the first `api` pod:

   ```bash
   kubectl get pods -n deployment-lab -l app=api -o jsonpath='{.items[0].spec.nodeName}'
   ```

### Step 4 — Build a custom table

Run:

```bash
kubectl get pods -n deployment-lab \
  -o custom-columns='NAME:.metadata.name,PHASE:.status.phase,NODE:.spec.nodeName,IP:.status.podIP'
```

Add another column that shows the container image.

### Step 5 — Watch the ReplicaSet react to a label change

Pick one pod from `web-deployment`. Change its `tier` label to `cache`:

```bash
kubectl label pod <pod-name> tier=cache --overwrite -n deployment-lab
```

Then run:

```bash
kubectl get pods -n deployment-lab --show-labels
kubectl get replicasets -n deployment-lab
```

- What happened? Why are there now 3 pods in the `web` Deployment instead of 2?
- How many ReplicaSets does `web-deployment` have?

### Step 6 — Clean up

Delete both Deployments:

```bash
kubectl delete -f web-deployment.yml
kubectl delete -f api-deployment.yml
```

## Challenge

Use `kubectl get` with `jsonpath` to produce a single line containing:

- the Deployment name
- the container image
- the number of replicas
- the `app` label

for both `web-deployment` and `api-deployment`.
