# Lab 1: RBAC & ServiceAccounts

## Objective

Give people and applications exactly the permissions they need - nothing more.

## Prerequisites

- Read [rbac.md](../../materials/security/rbac.md) and [serviceaccount.md](../../materials/security/serviceaccount.md)

## Exercise

### Step 1: Explore
1. List all ClusterRoles. Describe `view`, `edit` and `admin`.
2. What permissions does the `default` ServiceAccount have? (`kubectl auth can-i --list --as=system:serviceaccount:default:default`)

### Step 2: Read-only developer (namespace scoped)
1. Create namespace `team-blue`.
2. Create a ServiceAccount `dev-reader`.
3. Create a Role that allows `get, list, watch` on `pods, pods/log, services, deployments`.
4. Bind it to `dev-reader`.
5. Verify with `kubectl auth can-i` that it can list pods but cannot delete them or read secrets.

### Step 3: Use the SA from a pod
1. Run a pod `bitnami/kubectl` with `serviceAccountName: dev-reader`.
2. From inside, run `kubectl get pods`, `kubectl get secrets`, `kubectl get pods -n default`. Explain each result.

### Step 4: Kubeconfig for the SA
1. Create a token: `kubectl create token dev-reader -n team-blue`.
2. Build a kubeconfig file `dev-reader.kubeconfig` that uses this token.
3. Run `kubectl --kubeconfig dev-reader.kubeconfig get pods -n team-blue`.

### Step 5: CI deployer
Create an SA `ci-deployer` that can `create, update, patch, get, list` Deployments, Services and ConfigMaps in `team-blue` only - this is the identity Jenkins will use.

### Step 6: ClusterRole
Create a ClusterRole `node-viewer` (get/list nodes) and bind it with a ClusterRoleBinding to `dev-reader`. Why can't a RoleBinding be used here?

## Challenge Exercise

1. Use an aggregated ClusterRole (`aggregationRule`) to add custom permissions to the built-in `view` role.
2. Create a user certificate with a CSR (`CertificateSigningRequest`), approve it and give the user `edit` in `team-blue`.

## Deliverables
YAMLs + kubeconfig (with the token redacted) + answers.
