# Pod Security Admission & Cluster Security Overview

## Pod Security Standards (PSS)

| Level | Description |
|-------|-------------|
| **privileged** | No restrictions |
| **baseline** | Blocks known privilege escalations (hostNetwork, privileged, hostPath...) |
| **restricted** | Hardened: non-root, drop ALL caps, seccomp, no privilege escalation |

## Pod Security Admission (built in since 1.25)

Enabled per namespace with labels:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: secure-apps
  labels:
    pod-security.kubernetes.io/enforce: restricted   # reject
    pod-security.kubernetes.io/warn: restricted      # warn kubectl user
    pod-security.kubernetes.io/audit: restricted     # audit log
```

| Mode | Effect |
|------|--------|
| enforce | violating pods are rejected |
| warn | user gets a warning |
| audit | event recorded in audit log |

```bash
kubectl label ns dev pod-security.kubernetes.io/enforce=baseline
kubectl label --dry-run=server --overwrite ns --all pod-security.kubernetes.io/enforce=restricted
```

---

## The 4C's of Cloud Native Security

```
┌─ Cloud ──────────────────────────────┐
│ ┌─ Cluster ────────────────────────┐ │
│ │ ┌─ Container ──────────────────┐ │ │
│ │ │ ┌─ Code ───────────────────┐ │ │ │
│ │ │ └──────────────────────────┘ │ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Security checklist

| Area | Control |
|------|---------|
| API access | RBAC least privilege, no shared admin kubeconfig |
| Workload identity | dedicated ServiceAccounts |
| Pods | securityContext, PSA `restricted` |
| Network | default-deny NetworkPolicy |
| Secrets | encryption at rest, External Secrets / Sealed Secrets / Vault, RBAC on secrets |
| Images | scanning (Trivy), signed images (cosign), private registry, no `latest` |
| Policy | OPA Gatekeeper / Kyverno for custom rules |
| Runtime | Falco for runtime threat detection |
| Audit | API server audit logs |
| Nodes | patched OS, minimal images, CIS benchmark (kube-bench) |
