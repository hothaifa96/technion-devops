# Lab 1: Services & DNS

## Objective

Expose applications with ClusterIP, NodePort, LoadBalancer and headless Services and understand service discovery.

## Prerequisites

- Read [service.md](../../materials/networking/service.md) and [cluster-networking.md](../../materials/networking/cluster-networking.md)

## Exercise

### Step 1: Backend
Create a namespace `svc-lab` and a Deployment `whoami` (3 replicas, image `traefik/whoami`, port 80, label `app=whoami`).

### Step 2: ClusterIP
1. Write `clusterip.yml` that exposes `whoami` on port `8080` -> targetPort `80`.
2. From a temporary `curlimages/curl` pod, call the service 6 times. Do different pods answer?
3. List the endpoints of the service. Scale the deployment to 5 and list them again.

### Step 3: DNS
From a `busybox:1.36` pod:
1. `cat /etc/resolv.conf` - which IP is the nameserver? Which service owns that IP?
2. Resolve `whoami`, `whoami.svc-lab`, `whoami.svc-lab.svc.cluster.local`.
3. From a pod in the `default` namespace, which of the names above work?

### Step 4: NodePort
1. Create a NodePort service on port `30080`.
2. Access it with `curl $(minikube ip):30080` (or `minikube service --url`).

### Step 5: LoadBalancer
1. Change the type to `LoadBalancer`. What is the EXTERNAL-IP?
2. Run `minikube tunnel` in another terminal and check again.

### Step 6: Headless
1. Create a headless service (`clusterIP: None`) for the same pods.
2. `nslookup` it - compare the answer with the ClusterIP service.

### Step 7: Break it
1. Change the service selector to `app=whoamii`. What happens to endpoints and to curl?
2. Change targetPort to 8080. What error do you get?

## Challenge Exercise

1. Create an `ExternalName` service `google` that points to `www.google.com` and curl it from inside the cluster.
2. Create a Service **without a selector** + manual `EndpointSlice` that points to an external IP.
3. Use `sessionAffinity: ClientIP` and verify that the same pod answers.

## Deliverables
All YAML files + answers.
