# Lab: ConfigMap — Mounting and Injecting Configuration

## Objective

Create a `ConfigMap`, use it both as **environment variables** and as a **mounted file** in a Deployment, then extract configuration data from the running pod.

## Prerequisites

- minikube running with the Docker driver
- `kubectl` configured to talk to minikube

## Exercise

### Step 1 — Create the namespace

Create a file `namespace.yml` for a namespace called `configmap-lab`. Apply it.

### Step 2 — Create the ConfigMap

Write a file `app-config.yml` with a `ConfigMap` named `app-config` in namespace `configmap-lab`. It should have these three keys:

- `APP_COLOR`
- `WELCOME_MESSAGE`
- `LOG_LEVEL`

Give them any values you like, for example:

- `APP_COLOR: blue`
- `WELCOME_MESSAGE: Hello from the config map!`
- `LOG_LEVEL: debug`

Apply it.

### Step 3 — Inspect the ConfigMap

Run the following commands and write down the outputs:

1. `kubectl get configmap app-config -n configmap-lab`
   - What are the three data keys? How old is the ConfigMap?

2. `kubectl describe configmap app-config -n configmap-lab`
   - Do you see all three key/value pairs?

3. `kubectl get configmap app-config -n configmap-lab -o yaml`
   - How is the data stored? Compare with how you wrote the file.

### Step 4 — Write a Deployment that uses the ConfigMap

Create `web-deployment.yml` for a Deployment named `web-deployment` in `configmap-lab` with `1` replica.

The container should:

- Use the image `busybox:1.36`
- Run the command `sh -c 'while true; do echo "$WELCOME_MESSAGE"; sleep 10; done'`
- Load **all** keys from the `app-config` ConfigMap as environment variables using `envFrom`
- Mount the whole `app-config` ConfigMap as files under `/etc/config/`

Apply the Deployment.

### Step 5 — Extract configuration data from the pod

1. Find the pod name:

   ```bash
   kubectl get pods -n configmap-lab
   ```

2. Print the pod's environment variables:

   ```bash
   kubectl exec <pod-name> -n configmap-lab -- env
   ```

   - Can you see `APP_COLOR`, `WELCOME_MESSAGE`, and `LOG_LEVEL`?

3. Read the mounted files:

   ```bash
   kubectl exec <pod-name> -n configmap-lab -- cat /etc/config/APP_COLOR
   kubectl exec <pod-name> -n configmap-lab -- cat /etc/config/LOG_LEVEL
   ```

4. Read the pod logs:

   ```bash
   kubectl logs <pod-name> -n configmap-lab
   ```

   - Do the logs show the `WELCOME_MESSAGE` value?

5. Use `jsonpath` to extract the container image:

   ```bash
   kubectl get pod <pod-name> -n configmap-lab -o jsonpath='{.spec.containers[0].image}'
   ```

### Step 6 — Update the ConfigMap and roll the Deployment

Edit `app-config.yml` and change `WELCOME_MESSAGE` to a different value. Re-apply it.

Check the pod logs again:

```bash
kubectl logs <pod-name> -n configmap-lab
```

- Did the running pod pick up the change automatically?

**Environment variables do not update automatically.** Restart the Deployment so a new pod gets the new values:

```bash
kubectl rollout restart deployment/web-deployment -n configmap-lab
```

Wait for the new pod and then read its logs.

### Step 7 — Clean up

Delete the namespace:

```bash
kubectl delete namespace configmap-lab
```

## Challenge

Use `kubectl get pod <pod-name> -o jsonpath` to extract the full path of the ConfigMap volume mount in the pod.
