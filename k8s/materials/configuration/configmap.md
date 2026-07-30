# ConfigMap

## What is a ConfigMap?

A ConfigMap is a Kubernetes object used to store non-sensitive configuration data as key-value pairs. It decouples configuration from container images, making applications portable.

---

## Key Concepts

- Stores configuration data (non-sensitive)
- Key-value pairs or entire config files
- Injected into Pods as environment variables or mounted as files
- Changes to ConfigMaps can be picked up without redeploying (volume mount)

---

## Create ConfigMap from Command Line

```bash
# From literal values
kubectl create configmap my-config --from-literal=APP_ENV=production --from-literal=APP_PORT=8080

# From a file
kubectl create configmap my-config --from-file=app.conf

# From a directory
kubectl create configmap my-config --from-file=config/
```

---

## ConfigMap YAML

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
data:
  APP_ENV: production
  APP_PORT: "8080"
  LOG_LEVEL: info
```

---

## ConfigMap with File Content

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
  nginx.conf: |
    server {
        listen 80;
        server_name localhost;
        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
    }
```

---

## Using ConfigMap as Environment Variables

### All keys at once

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: config-env-pod
spec:
  containers:
    - name: app
      image: nginx
      envFrom:
        - configMapRef:
            name: my-config
```

### Specific keys

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: config-env-pod
spec:
  containers:
    - name: app
      image: nginx
      env:
        - name: ENVIRONMENT
          valueFrom:
            configMapKeyRef:
              name: my-config
              key: APP_ENV
```

---

## Using ConfigMap as Volume

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: config-volume-pod
spec:
  containers:
    - name: app
      image: nginx
      volumeMounts:
        - name: config-vol
          mountPath: /etc/config
  volumes:
    - name: config-vol
      configMap:
        name: my-config
```

Each key becomes a file in `/etc/config/`.

---

## Mount Specific Keys

```yaml
volumes:
  - name: config-vol
    configMap:
      name: nginx-config
      items:
        - key: nginx.conf
          path: nginx.conf
```

---

## ConfigMap vs Secret

| Feature | ConfigMap | Secret |
|---------|-----------|--------|
| Data type | Non-sensitive config | Sensitive data |
| Encoding | Plain text | Base64 |
| Size limit | 1 MB | 1 MB |
| Use case | App config, feature flags | Passwords, tokens, keys |

---

## Common kubectl Commands

```bash
kubectl apply -f configmap.yaml
kubectl get configmaps
kubectl get cm
kubectl describe cm my-config
kubectl delete cm my-config
```

---
