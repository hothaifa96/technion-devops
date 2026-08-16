# Lab: Chat Microservices — ConfigMap + Ingress

## Objective

Build two chat microservices that talk to each other over HTTP, plus a frontend that shows the merged conversation. The backend URLs are stored in a `ConfigMap` and injected into the pods and the frontend.

## What it does

- `chatter-a` and `chatter-b` are the same Node/Express app deployed twice.
- Every few seconds each service picks a random phrase and `POST`s it to the other service.
- Each service keeps an in-memory list of messages.
- The nginx frontend reads `config.json` (mounted from a `ConfigMap`), then fetches messages from both backends and displays them.
- A single Ingress on `http://chat.local` routes:
  - `/` → frontend
  - `/api/a` → `chatter-a`
  - `/api/b` → `chatter-b`

> No `PVC`, `PV`, or `StorageClass` is used. State is in memory.

## Project layout

```
chat-microservices/
├── chatter/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   └── nginx.default.conf
└── k8s/
    ├── namespace.yml
    ├── configmap.yml
    ├── frontend/
    │   ├── deployment.yml
    │   ├── service.yml
    │   └── ingress.yml
    ├── chatter-a/
    │   ├── deployment.yml
    │   ├── service.yml
    │   └── ingress.yml
    └── chatter-b/
        ├── deployment.yml
        ├── service.yml
        └── ingress.yml
```

## Step 1 — Start minikube and enable ingress

```bash
minikube start --driver=docker
minikube addons enable ingress
```

## Step 2 — Build the images inside minikube's Docker

```bash
cd /Users/hothaifa/workspace/devops-technion-3/k8s/labs/chat-microservices

eval $(minikube docker-env)

docker build -t chat-frontend:latest frontend/
docker build -t chatter:latest chatter/

eval $(minikube docker-env -u)
```

## Step 3 — Apply the manifests

```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/chatter-a/
kubectl apply -f k8s/chatter-b/
```

## Step 4 — Add `chat.local` to `/etc/hosts` and start the tunnel

```bash
minikube ip
```

Add the IP to `/etc/hosts`:

```
192.168.49.2  chat.local
```

In a second terminal run:

```bash
minikube tunnel
```

## Step 5 — Verify and open

```bash
kubectl get all -n chat-lab
kubectl get ingress -n chat-lab
```

Open the chat in a browser:

```bash
open http://chat.local/
```

You should see random messages appearing every few seconds from **A** (blue) and **B** (green).

Test with curl:

```bash
curl http://chat.local/api/a/messages
curl http://chat.local/api/b/messages
```

## How the URLs are stored

- The `chat-config` ConfigMap contains `CHAT_A_URL` and `CHAT_B_URL` for the backend Deployments.
- It also contains `config.json` for the frontend.
- `chatter-a` and `chatter-b` read their `OTHER_URL` from the ConfigMap using `valueFrom.configMapKeyRef`.
- The frontend mounts `config.json` as a file so the page knows where to load the messages from.

## Challenge

Try converting the `chat-config` ConfigMap into a `Secret` for the API URLs. The frontend `config.json` would need to be stored as base64 data, and the backend `valueFrom` would use `secretKeyRef` instead of `configMapKeyRef`.

## Clean up

```bash
kubectl delete namespace chat-lab
```

Stop the tunnel with `Ctrl-C` when you are done.
