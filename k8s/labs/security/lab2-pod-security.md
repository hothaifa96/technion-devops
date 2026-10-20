# Lab 2: Pod Security - securityContext & Pod Security Admission

## Objective

Harden workloads and enforce security standards on namespaces.

## Prerequisites

- Read [security-context.md](../../materials/security/security-context.md) and [pod-security.md](../../materials/security/pod-security.md)

## Exercise

### Step 1: See the danger
1. Run a pod with `privileged: true` and a `hostPath: /` mount.
2. `chroot` into the host. What can you see / do? (`cat /etc/shadow`, `crictl ps`)
3. Delete it. Write 3 sentences on why this is dangerous in a shared cluster.

### Step 2: Enforce restricted
1. Create namespace `prod` with labels `enforce=restricted`, `warn=restricted`.
2. Try `kubectl -n prod run web --image=nginx`. Copy the error - list every violation.

### Step 3: Make it compliant
Write a Deployment for nginx that passes `restricted`:
- `nginxinc/nginx-unprivileged` image
- `runAsNonRoot`, `runAsUser: 101`
- `allowPrivilegeEscalation: false`
- `capabilities.drop: ["ALL"]`
- `seccompProfile: RuntimeDefault`
- `readOnlyRootFilesystem: true` with `emptyDir` for `/tmp`

Verify: `id`, try to write to `/`, try `apk add` / `apt`.

### Step 4: Baseline vs restricted
1. Create namespace `staging` with `enforce=baseline`.
2. Which of these pods are allowed in `staging` and which in `prod`? Test each:
   - running as root (no securityContext)
   - `hostNetwork: true`
   - `capabilities.add: ["NET_ADMIN"]`
   - `privileged: true`

### Step 5: Secrets hygiene
1. Create a secret and show how anyone with `get secrets` can read it.
2. Mount it as a file (not env var) with `defaultMode: 0400`. Why are files preferred over env vars?
3. Research and explain in a few lines: Sealed Secrets vs External Secrets Operator vs Vault.

## Challenge Exercise

1. Install Kyverno and write a policy that rejects images with the `:latest` tag.
2. Run `trivy k8s --report summary cluster` and fix 3 findings.

## Deliverables
YAMLs + answers.
