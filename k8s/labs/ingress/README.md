# Lab: Ingress — XO Game with Frontend + 2 Microservices
 
Build a 3-tier application in minikube and expose it through a single Ingress host:

- **Frontend** — `nginx` serving a static X/O game page. It must mount a `ConfigMap` that tells it the URLs of the two backend services.
- **Game Service** — `Node/Express` API that keeps the 3x3 board state, current player, and winner.
- **Score Service** — `Node/Express` API that tracks wins for `X`, wins for `O`, and draws.

The Ingress routes all traffic on `http://game.local`:

- `http://game.local/` → frontend
- `http://game.local/api/game` → game-service
- `http://game.local/api/score` → score-service

> All data is kept **in memory** inside the pods. No `PVC`, `PV`, or `StorageClass` is used.

---

## Project layout

```
ingress/
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   └── nginx.default.conf
├── game-service/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
├── score-service/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
└── k8s/
    ├── namespace.yml
    ├── configmap.yml
    ├── frontend/
    │   ├── deployment.yml
    │   ├── service.yml
    │   └── ingress.yml
    ├── game-service/
    │   ├── deployment.yml
    │   ├── service.yml
    │   └── ingress.yml
    └── score-service/
        ├── deployment.yml
        ├── service.yml
        └── ingress.yml
```

---

## Step 1 — Start minikube and enable ingress

```bash
minikube start --driver=docker
minikube addons enable ingress
```

---

## Step 2 — Build the images inside minikube's Docker

Docker Desktop on macOS cannot see the cluster's images unless you build them from inside minikube:

```bash
eval $(minikube docker-env)
....
.
.
.
....

eval $(minikube docker-env -u)
cd ..
```

Dont forget The `imagePullPolicy: ` in the Deployments tells Kubernetes to use these local/published images and not pull from Docker Hub.

---

## Step 3 — Apply the manifests

Apply the namespace first, then the rest:

```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/game-service/
kubectl apply -f k8s/score-service/
```

Or use the recursive option:

```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -R -f k8s/
```

---

## Step 4 — Add `game.local` to `/etc/hosts` and start the tunnel

Add it to `/etc/hosts`. Because we use the Docker driver, also run `minikube tunnel` so the cluster IP is reachable from host:

```bash
sudo nano /etc/hosts
```

Add a line like:

```
192.168.49.2  game.local
or 
127.0.0.1  game.local
```

In a second terminal run:

```bash
minikube tunnel
```

Leave it open. It forwards ports 80 and 443 from your machine to the cluster.

---

## Step 5 — Verify and play

Check that everything is running:

```bash
kubectl get all -n game-lab
kubectl get ingress -n game-lab
```

Open the game in a browser:

```bash
open http://game.local/
```

Click the cells to play, then click **Reset Game** to start over.

Test with curl:

```bash
curl http://game.local/api/game
curl http://game.local/api/score
curl -X POST -H "Content-Type: application/json" \
  -d '{"position": 0, "player": "X"}' \
  http://game.local/api/game/move
```

---

## Challenge

1. Create a new Ingress that exposes the game service on a different path, for example `/game/play`. Update the frontend to use this new path.

2. Create a new Ingress that exposes the score service on a different path, for example `/game/score`. Update the frontend to use this new path.

3. enforce tls termination for all ingresses

hint: use self-signed certificates
command: 
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=game.local/O=game.local"
```
