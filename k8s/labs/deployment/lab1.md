# Lab 1: Create, Scale and Inspect a Deployment

## Objective

Create a Deployment with 3 replicas, inspect it with `kubectl`, and practice scaling. All data should be extracted with `kubectl` commands — do not rely on guessing.

## Prerequisites

- minikube running with the Docker driver
- `kubectl` configured to talk to minikube

## Exercise

### Step 1 — Create a namespace

Create a file named `namespace.yml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: deployment-lab
```

Apply it and verify it exists.

### Step 2 — Write the Deployment manifest

Create a file named `nginx-deployment.yml`. It should:

- Be in the `deployment-lab` namespace
- Be named `nginx-deployment`
- Have `3` replicas
- Use the image `nginx:1.25`
- Have container port `80`
- Pods should be labelled `app: nginx` and `tier: frontend`

Apply it.

### Step 3 — Extract data from the cluster

Run the following commands and write down the answers:

1. `kubectl get deployment nginx-deployment -n deployment-lab`
   - How many **DESIRED**, **CURRENT**, **UP-TO-DATE**, and **AVAILABLE** replicas are there?

2. `kubectl get pods -n deployment-lab`
   - How many pods are running? What are their names?

3. `kubectl get pods -n deployment-lab -o wide`
   - On which node is each pod running? What is each pod's IP?

4. `kubectl describe deployment nginx-deployment -n deployment-lab`
   - What is the **Selector**?
   - What **Events** do you see at the bottom?
   - What image is the container running?

5. `kubectl describe pod <one-of-the-pod-names> -n deployment-lab`
   - Who created the pod? (Hint: look for the `Controlled By` line.)
   - What is the `Restart Count`?

### Step 4 — Scale the Deployment

Scale the Deployment to `5` replicas using `kubectl scale`:

```bash
kubectl scale deployment nginx-deployment --replicas=5 -n deployment-lab
```

Verify with `kubectl get pods -n deployment-lab` and `kubectl get deployment -n deployment-lab`.

Now edit `nginx-deployment.yml` and change the replica count to `2`. Re-apply the file and verify again.

### Step 5 — Clean up

Delete the Deployment:

```bash
kubectl delete -f nginx-deployment.yml
```

## Challenge

Create the same Deployment using only `kubectl create deployment` and `kubectl scale` commands, without using a YAML file. Then delete it.
