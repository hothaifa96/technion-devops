# Ingress

## What is Ingress?

Ingress is a Kubernetes resource that manages external HTTP/HTTPS access to services in the cluster. It provides URL-based routing, SSL termination, and virtual hosting.

---

## Key Concepts

- Routes external traffic to internal Services
- Works at Layer 7 (HTTP/HTTPS)
- Requires an Ingress Controller to function (e.g., Nginx, Traefik, HAProxy)
- Supports path-based and host-based routing
- Supports TLS/SSL termination

---

## Ingress vs Service (LoadBalancer)

| Feature | Ingress | LoadBalancer |
|---------|---------|--------------|
| Layer | L7 (HTTP) | L4 (TCP/UDP) |
| Single IP for multiple services | Yes | No (one IP per service) |
| Path-based routing | Yes | No |
| SSL termination | Yes | No (needs separate config) |
| Cost | One LB for all | One LB per service |

---

## Ingress Controller

You must install an Ingress Controller before Ingress resources work.

```bash
# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.0/deploy/static/provider/cloud/deploy.yaml
```

---

## Basic Ingress YAML

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-service
                port:
                  number: 80
```

---

## Path-Based Routing

Route different paths to different services.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path-ingress
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

---

## Host-Based Routing

Route different domains to different services.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: host-ingress
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 8080
    - host: web.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
```

---

## TLS / HTTPS

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress
spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls-secret
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-service
                port:
                  number: 80
```

Create the TLS secret:

```bash
kubectl create secret tls myapp-tls-secret --cert=tls.crt --key=tls.key
```

---

## Path Types

| Type | Description |
|------|-------------|
| Prefix | Matches URL paths by prefix (e.g., /api matches /api/v1) |
| Exact | Matches the exact URL path only |
| ImplementationSpecific | Depends on the Ingress Controller |

---

## Annotations (Nginx Ingress)

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
```

---

## Common kubectl Commands

```bash
kubectl apply -f ingress.yaml
kubectl get ingress
kubectl describe ingress my-ingress
kubectl delete ingress my-ingress
```

---
