# Secret

## What is a Secret?

A Secret is a Kubernetes object that stores sensitive data such as passwords, tokens, and keys. Secrets are base64-encoded and can be mounted as files or exposed as environment variables in Pods.

---

## Key Concepts

- Stores sensitive information (passwords, API keys, TLS certs)
- Data is base64-encoded (not encrypted by default)
- Can be mounted as volumes or injected as environment variables
- Separate from application code for security

---

## Types of Secrets

| Type | Description |
|------|-------------|
| Opaque | Generic key-value pairs (default) |
| kubernetes.io/tls | TLS certificate and key |
| kubernetes.io/dockerconfigjson | Docker registry credentials |
| kubernetes.io/basic-auth | Username and password |
| kubernetes.io/ssh-auth | SSH private key |

---

## Create Secret from Command Line

```bash
# Generic secret
kubectl create secret generic my-secret --from-literal=username=admin --from-literal=password=secret123

# From file
kubectl create secret generic my-secret --from-file=config.json

# TLS secret
kubectl create secret tls my-tls --cert=tls.crt --key=tls.key

# Docker registry secret
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=myuser \
  --docker-password=mypass \
  --docker-email=myemail@example.com
```

---

## Secret YAML (Opaque)

Values must be base64-encoded.

```bash
echo -n "admin" | base64       # YWRtaW4=
echo -n "secret123" | base64   # c2VjcmV0MTIz
```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
data:
  username: YWRtaW4=
  password: c2VjcmV0MTIz
```

---

## Secret with stringData (Plain Text)

Kubernetes encodes it automatically.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
stringData:
  username: admin
  password: secret123
```

---

## Using Secret as Environment Variables

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-env-pod
spec:
  containers:
    - name: app
      image: nginx
      env:
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: my-secret
              key: username
        - name: DB_PASS
          valueFrom:
            secretKeyRef:
              name: my-secret
              key: password
```

---

## Using Secret as a Volume

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-volume-pod
spec:
  containers:
    - name: app
      image: nginx
      volumeMounts:
        - name: secret-vol
          mountPath: /etc/secrets
          readOnly: true
  volumes:
    - name: secret-vol
      secret:
        secretName: my-secret
```

Files created: `/etc/secrets/username` and `/etc/secrets/password`

---

## TLS Secret YAML

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-cert>
  tls.key: <base64-encoded-key>
```

---

## Common kubectl Commands

```bash
kubectl apply -f secret.yaml
kubectl get secrets
kubectl describe secret my-secret
kubectl get secret my-secret -o yaml
kubectl delete secret my-secret
```

---

## Security Best Practices

- Enable encryption at rest in etcd
- Use RBAC to restrict access to secrets
- Use external secret managers (Vault, AWS Secrets Manager)
- Avoid committing secrets to Git
- Use tools like Sealed Secrets or External Secrets Operator

---
