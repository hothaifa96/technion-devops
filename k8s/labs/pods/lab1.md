# Lab 1: Basic Pod Management

## Objective

Learn how to create, inspect, and delete Kubernetes Pods using kubectl commands.

## Prerequisites

- kubectl installed and configured to connect to a Kubernetes cluster
- Basic understanding of YAML
- minikube installed and running

## Exercise

### Step 1: Create a Pod Manifest

Create a file named `grafana-pod.yaml` with the following content:

```yaml
# create the yaml content for a pod that runs grafana
# please review this image description # https://hub.docker.com/r/grafana/grafana
```

### Step 2: Apply the Pod

Use `kubectl apply` to create the pod

### Step 3: Get Pod Information

Check the status of your pod .
- if its not running status then check the logs and debug the issue.

View detailed information about the pod 
what is the pod ip?
what is the pod node?
what is the pod restart count?

### Step 4: View Pod Logs

Check the logs from the grafana container:

### Step 5: Delete the Pod

Remove the pod using kubectl

### Step 7: Verify Deletion

Confirm the pod has been deleted


## Challenge Exercise

1. Create a second pod named `busybox-pod` using the `busybox:latest` image 
2. Apply the pod using `kubectl apply`
3. Get all pods to verify both are running
4. Delete only the busybox pod
5. Delete the grafna pod using the manifest file not with `kubectl delete pod <name>`
