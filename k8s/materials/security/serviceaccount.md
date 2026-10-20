# ServiceAccounts

- **Users** = humans (certs, OIDC, IAM) - not Kubernetes objects
- **ServiceAccounts** = identities for **processes running in Pods**

Every namespace has a `default` SA. Pods use it unless `serviceAccountName` is set. A short-lived token is projected to `/var/run/secrets/kubernetes.io/serviceaccount/token`.

---

## Create & use

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: pod-reader-sa
  namespace: dev
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: dev
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: pod-reader-binding
  namespace: dev
subjects:
  - kind: ServiceAccount
    name: pod-reader-sa
    namespace: dev
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: v1
kind: Pod
metadata:
  name: kubectl-pod
  namespace: dev
spec:
  serviceAccountName: pod-reader-sa
  containers:
    - name: kubectl
      image: bitnami/kubectl:latest
      command: ["sleep", "3600"]
```

```bash
kubectl exec -n dev kubectl-pod -- kubectl get pods      # allowed
kubectl exec -n dev kubectl-pod -- kubectl get secrets   # Forbidden
kubectl auth can-i list pods -n dev --as=system:serviceaccount:dev:pod-reader-sa
kubectl create token pod-reader-sa -n dev --duration=1h
```

---

## Cloud identities

| Cloud | Feature | How |
|-------|---------|-----|
| AWS EKS | IRSA / Pod Identity | annotate SA with `eks.amazonaws.com/role-arn` |
| GCP GKE | Workload Identity | annotate SA with GCP SA |
| Azure AKS | Workload Identity | federated credentials |

Pods get cloud permissions (S3, DynamoDB...) without static access keys.

---

## Best practices

- One SA per application, least privilege Role
- `automountServiceAccountToken: false` when the app doesn't call the API
- Never bind `cluster-admin` to an app SA
