# RBAC (Role-Based Access Control)

## What is RBAC?

RBAC controls who can perform what actions on which resources in a Kubernetes cluster. It uses Roles, ClusterRoles, RoleBindings, and ClusterRoleBindings.

---

## Key Concepts

| Resource | Scope | Description |
|----------|-------|-------------|
| Role | Namespace | Defines permissions within a namespace |
| ClusterRole | Cluster | Defines permissions cluster-wide |
| RoleBinding | Namespace | Grants Role to a user/group/SA in a namespace |
| ClusterRoleBinding | Cluster | Grants ClusterRole cluster-wide |

---

## Role (Namespace-scoped)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: dev
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "watch", "list"]
```

---

## ClusterRole (Cluster-wide)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "watch", "list"]
```

---

## RoleBinding

Bind a Role to a user within a namespace.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: dev
subjects:
  - kind: User
    name: developer1
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

---

## ClusterRoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-secrets-global
subjects:
  - kind: Group
    name: devops-team
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

---

## ServiceAccount

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deploy-bot
  namespace: default
```

Bind a ClusterRole to a ServiceAccount:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: deploy-bot-binding
subjects:
  - kind: ServiceAccount
    name: deploy-bot
    namespace: default
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

---

## Common Verbs

| Verb | Description |
|------|-------------|
| get | Read a single resource |
| list | List resources |
| watch | Watch for changes |
| create | Create resources |
| update | Modify resources |
| patch | Partially modify resources |
| delete | Delete resources |

---

## Common kubectl Commands

```bash
kubectl get roles -n dev
kubectl get clusterroles
kubectl get rolebindings -n dev
kubectl get clusterrolebindings
kubectl describe role pod-reader -n dev
kubectl auth can-i create pods --as developer1 -n dev
kubectl auth can-i delete nodes --as developer1
```

---
