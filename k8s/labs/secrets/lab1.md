# Lab: Secrets — MongoDB + Mongo-Express

## Objective

Create a Kubernetes `Secret`, use it to pass credentials to a MongoDB deployment, then run Mongo-Express and extract the credentials from inside the cluster.

> This lab uses in-memory data only. No `PVC`, `PV`, or `StorageClass` is required.

## Prerequisites

- minikube running with the Docker driver
- `kubectl` configured to talk to minikube

## Exercise

### Step 1 — Create the namespace

Create `namespace.yml` for a namespace called `secrets-lab`. Apply it.

### Step 2 — Create the Secret

Create a `Secret` named `mongo-secret` in `secrets-lab` with two keys:

- `MONGO_ROOT_USERNAME`
- `MONGO_ROOT_PASSWORD`

You may create it from the command line:

```bash
kubectl create secret generic mongo-secret \
  --from-literal=MONGO_ROOT_USERNAME=admin \
  --from-literal=MONGO_ROOT_PASSWORD=secret123 \
  -n secrets-lab
```

Or by writing a `mongo-secret.yml` file and base64-encoding the values manually.

### Step 3 — Extract data from the Secret

Run these `kubectl` commands and answer the questions:

1. `kubectl get secret mongo-secret -n secrets-lab`
   - How many data items does the secret contain?

2. `kubectl get secret mongo-secret -n secrets-lab -o jsonpath='{.data.MONGO_ROOT_PASSWORD}'`
   - Decode the value with `| base64 -d`. Does it match what you set?

3. `kubectl describe secret mongo-secret -n secrets-lab`
   - What type is the Secret? Are the values readable in `describe`?

### Step 4 — Deploy MongoDB

Write `mongodb.yml` with:

- A `Deployment` named `mongodb` in `secrets-lab`
- Image `mongo:6`
- 1 replica
- Environment variables `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` read from the `mongo-secret` Secret
- A `Service` named `mongodb-svc` on port `27017`

Apply it and wait for the pod to be `Running`.

### Step 5 — Verify credentials inside the MongoDB pod

Find the pod name and extract the real username and password from its environment:

```bash
kubectl get pods -n secrets-lab
kubectl exec <mongodb-pod> -n secrets-lab -- env | grep MONGO
```

Check that the values come from the Secret and are not written directly in the manifest.

### Step 6 — Deploy Mongo-Express

Write `mongo-express.yml` with:

- A `Deployment` named `mongo-express` in `secrets-lab`
- Image `mongo-express:latest`
- 1 replica
- Environment variables:
  - `ME_CONFIG_MONGODB_ADMINUSERNAME` from the Secret
  - `ME_CONFIG_MONGODB_ADMINPASSWORD` from the Secret
  - `ME_CONFIG_MONGODB_SERVER=mongodb-svc`
- A `Service` named `mongo-express-svc` on port `8081`

Apply it and wait for the pod to be `Running`.

### Step 7 — Connect to Mongo-Express

Run a port-forward:

```bash
kubectl port-forward service/mongo-express-svc -n secrets-lab 8081:8081
```

Open `http://localhost:8081` in a browser.

If everything is correct you should see the Mongo-Express dashboard. If you get a connection error, check the logs:

```bash
kubectl logs <mongo-express-pod> -n secrets-lab
```

### Step 8 — Extract more data

Run these commands and record the answers:

1. `kubectl get pods -n secrets-lab -o custom-columns='NAME:.metadata.name,STATUS:.status.phase,CONTAINER:.spec.containers[0].name'`
   - What is the container name in each pod?

2. `kubectl describe pod <mongo-express-pod> -n secrets-lab`
   - Look for the `Environment` section. Where do the values come from? (There should be `ConfigMap` or `Secret` references.)

3. `kubectl get deployment mongo-express -n secrets-lab -o jsonpath='{.spec.template.spec.containers[0].env[*].name}'`
   - What environment variables are configured?

### Step 9 — Clean up

Delete the namespace:

```bash
kubectl delete namespace secrets-lab
```

## Challenge

Create a second Secret named `mongo-express-basic-auth` with `ME_CONFIG_BASICAUTH_USERNAME` and `ME_CONFIG_BASICAUTH_PASSWORD`, mount it in the Mongo-Express Deployment, and verify with `kubectl exec <pod> -- env`.
