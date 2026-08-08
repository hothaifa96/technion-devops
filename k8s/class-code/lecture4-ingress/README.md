# Lecture 4 — Ingress Demo

A tiny, deployable 3-tier app for teaching Kubernetes `Ingress` to new students.

- **Frontend**: React (runs with `npm start` locally, served by nginx in the cluster)
- **Microservice A**: `api-a` — Node/Express API
- **Microservice B**: `api-b` — Node/Express API
- **Ingress rules**:
  - `http://myapp.local/` → frontend
  - `http://myapp.local/api-a` → api-a
  - `http://myapp.local/api-b` → api-b

The frontend has two buttons that call the microservices.

---

## Project layout

```
lecture4-ingress/
├── frontend/                # React app
│   ├── package.json
│   ├── public/config.json   # local dev API URLs
│   ├── Dockerfile
│   └── src/App.js           # fetches /config.json at runtime
├── api-a/                   # microservice A
│   ├── package.json
│   ├── index.js
│   └── Dockerfile
├── api-b/                   # microservice B
│   ├── package.json
│   ├── index.js
│   └── Dockerfile
└── k8s/
    ├── namespace.yaml
    ├── frontend/
    │   ├── configmap.yaml   # API URLs using K8s service names
    │   ├── deployment.yaml  # mounts ConfigMap as /config.json
    │   ├── service.yaml
    │   └── ingress.yaml     # routes "myapp.local/" to frontend
    ├── api-a/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── ingress.yaml     # routes "myapp.local/api-a" to api-a
    └── api-b/
        ├── deployment.yaml
        ├── service.yaml
        └── ingress.yaml     # routes "myapp.local/api-b" to api-b
```

There are **two separate Ingress files** to demonstrate:

1. How different `Ingress` resources can share the same host.
2. How path-based routing maps to different backend `Service`s.

---

## Run locally (without Kubernetes)

Open three terminal tabs:

### 1. Microservice A

```bash
cd api-a
npm install
PORT=3001 npm start
```

### 2. Microservice B

```bash
cd api-b
npm install
PORT=3002 npm start
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

`public/config.json` already has local dev URLs:

```json
{
  "apiAUrl": "http://localhost:3001",
  "apiBUrl": "http://localhost:3002"
}
```

The browser opens at `http://localhost:3000`. Click the buttons; the frontend fetches `/config.json` and calls the URLs it contains.

---

## Deploy to Minikube

### 1. Start Minikube and enable the ingress addon

```bash
minikube start
minikube addons enable ingress
```

> If you use the Docker driver on macOS/Windows, also run `minikube tunnel` in a separate terminal before opening the app.

### 2. Build images inside Minikube's Docker daemon

```bash
eval $(minikube docker-env)

cd k8s-class-code/lecture4-ingress/frontend
docker build -t frontend:latest .

cd ../api-a
docker build -t api-a:latest .

cd ../api-b
docker build -t api-b:latest .

eval $(minikube docker-env -u)   # restore local docker
```

### 3. Apply all manifests

```bash
cd k8s-class-code/lecture4-ingress/k8s

kubectl apply -f namespace.yaml
kubectl apply -f frontend/
kubectl apply -f api-a/
kubectl apply -f api-b/
```

### 4. Add the host to `/etc/hosts`

```bash
echo "$(minikube ip) myapp.local" | sudo tee -a /etc/hosts
```

### 5. Verify

```bash
kubectl get all -n lecture4-ingress
kubectl get ingress -n lecture4-ingress
```

### 6. Open the app

```bash
open http://myapp.local        # macOS
# or
xdg-open http://myapp.local    # Linux
# or
# browser to http://myapp.local
```

Click **Ping API A** and **Ping API B**. The frontend loads `config.json` (served by `frontend-config` ConfigMap) which points to the internal service names:

```yaml
data:
  config.json: |
    {
      "apiAUrl": "http://api-a:3000",
      "apiBUrl": "http://api-b:3000"
    }
```

So the browser actually makes requests to:

- `http://api-a:3000/`
- `http://api-b:3000/`

using Kubernetes service DNS names.

---

## Test with curl

```bash
curl http://myapp.local/api-a
curl http://myapp.local/api-b
```

---

## Clean up

```bash
cd k8s-class-code/lecture4-ingress/k8s
kubectl delete -f .
```

Or delete the whole namespace:

```bash
kubectl delete namespace lecture4-ingress
```

---

## What to teach

1. **Ingress is not a Service**. It is an L7 (HTTP) routing rule that sends traffic to Services.
2. **Path-based routing**. Different URL paths on the same host reach different backend Services.
3. **Multiple Ingress resources can share one host**. Here, `api-a-ingress`, `api-b-ingress`, and `frontend-ingress` all use `myapp.local`.
4. **Services are backends**. The `Ingress` only points to a `Service` and a `Service` selects pods.
5. **Pods reach Services by DNS name**. The frontend calls `http://api-a:3000` and `http://api-b:3000` from a ConfigMap.
6. **ConfigMaps decouple config from code**. URLs live in `k8s/frontend/configmap.yaml` and are mounted into the container.
7. **DNS / hosts**. Minikube gives an IP; students must map `myapp.local` to that IP, or use `minikube tunnel`.
