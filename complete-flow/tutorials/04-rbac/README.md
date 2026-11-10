# Tutorial: RBAC step by step — Roles, RoleBindings, ClusterRoles

RBAC = **who** (subject) may do **what** (verb on resource) **where**
(namespace or cluster). Two objects per grant:

```
  WHO            WHAT                                    WHERE
┌─────────┐   ┌─────────────────────────┐          ┌──────────────────┐
│ Subject │<--│ RoleBinding binds WHO───│--> Role  │ rules: verbs +   │
│         │   │        to WHAT, in THIS│          │ apiGroups+resources
│ SA/user │   │        namespace        │          └──────────────────┘
└─────────┘   └─────────────────────────┘              namespace scope
              ClusterRoleBinding --> ClusterRole  =    cluster scope
```

**RBAC is deny-by-default and allow-only**: there are no "deny" rules; if no
binding grants a permission, the answer is `Forbidden`.

## Step 0 — deploy the lab

```bash
kubectl apply -f manifests/00-setup.yaml
kubectl wait --for=condition=ready pod/alice-shell -n rbac-lab --timeout=120s
kubectl -n rbac-lab rollout status deploy/hello
# tools for the "inside a pod" experiment (no policies are in the way)
kubectl exec -n rbac-lab alice-shell -- sh -c \
  "apt-get update -qq && apt-get install -y -qq curl"
```

Three identities exist now: `alice`, `bob`, `auditor` — all ServiceAccounts in
`rbac-lab`.

## Step 1 — prove that a ServiceAccount can do nothing

`kubectl auth can-i` asks the API server's own authorizer — it's the same
check real requests get. `--as` impersonates a user:

```bash
kubectl auth can-i list pods -n rbac-lab --as=system:serviceaccount:rbac-lab:alice   # no
kubectl auth can-i get secrets -n rbac-lab --as=system:serviceaccount:rbac-lab:alice # no
```

SA names inside the API are always `system:serviceaccount:<ns>:<name>`.

## Step 2 — a Role + RoleBinding makes alice a pod reader

```bash
kubectl apply -f manifests/01-role-pod-reader.yaml
```

Walk the YAML with the class: `rules[].apiGroups` (`""` = core group),
`resources` (note `pods/log` — subresources are separate resources!),
`verbs`. Then test:

```bash
A=system:serviceaccount:rbac-lab:alice
kubectl auth can-i list pods -n rbac-lab --as=$A        # yes
kubectl auth can-i get pods/log -n rbac-lab --as=$A     # yes
kubectl auth can-i delete pods -n rbac-lab --as=$A      # no
kubectl auth can-i get secrets -n rbac-lab --as=$A      # no  (secrets NOT in the role)
kubectl auth can-i list pods -n default --as=$A         # no  (wrong namespace!)
```

**Key teaching points**

- A `Role` only grants rights **in its own namespace**. Same role in
  `default`? Alice can't touch it.
- `pods` and `pods/log` are different resources — granting pods doesn't
  grant logs.
- Secrets are *not* "reading pods stuff". You must grant them explicitly —
  which is exactly why least-privilege roles exclude them.

List every permission alice has:

```bash
kubectl auth can-i --list -n rbac-lab --as=$A
```

## Step 3 — surgical rights with `resourceNames` (bob, the on-call)

```bash
kubectl apply -f manifests/02-role-job-runner.yaml
B=system:serviceaccount:rbac-lab:bob

kubectl auth can-i create jobs -n rbac-lab --as=$B                        # yes
kubectl auth can-i patch cronjobs/hourly-task -n rbac-lab --as=$B         # yes
kubectl auth can-i patch cronjobs/other-x -n rbac-lab --as=$B             # no
kubectl auth can-i patch deployments/hello -n rbac-lab --as=$B            # yes
kubectl auth can-i patch deployments/web -n rbac-lab --as=$B              # no
```

`verb resource/name` is how you test `resourceNames`. Now watch it work for
real — bob triggers the hourly job on demand and restarts **only** the
deployment he's allowed to:

```bash
kubectl -n rbac-lab create job bob-trigger --from=cronjob/hourly-task --as=$B   # created
kubectl -n rbac-lab rollout restart deploy/hello --as=$B                        # restarted
kubectl -n rbac-lab rollout restart deploy/postgres --as=$B                     # Forbidden!
kubectl -n rbac-lab delete pod hello-xxx --as=$B                                # Forbidden (no delete on pods)
```

## Step 4 — cluster scope needs ClusterRole + ClusterRoleBinding

`nodes` don't live in a namespace, so a `Role` can never grant them:

```bash
kubectl auth can-i list nodes --as=$A    # no
kubectl apply -f manifests/03-clusterrole-node-viewer.yaml
kubectl auth can-i list nodes --as=$A    # yes
```

The binding matrix — draw this on the board:

| | binds a Role | binds a ClusterRole |
|---|---|---|
| **RoleBinding** | rights in this ns only | rights in this ns only |
| **ClusterRoleBinding** | impossible | rights **everywhere**, incl. cluster-scoped |

## Step 5 — reuse a built-in ClusterRole in one namespace (auditor)

```bash
kubectl apply -f manifests/04-rolebinding-builtin-clusterrole.yaml
U=system:serviceaccount:rbac-lab:auditor
kubectl auth can-i list pods -n rbac-lab --as=$U     # yes  (built-in "view")
kubectl auth can-i get secrets -n rbac-lab --as=$U   # no   (view excludes secrets - read it!)
kubectl auth can-i list pods -n default --as=$U      # no   (RoleBinding = this ns only)
kubectl describe clusterrole view | head -40          # show the rules
```

This is how you hand out "read-only access to *your* namespace" without
writing any rules of your own.

## Step 6 — RBAC from inside a pod (the API call, unfiltered)

Pods get a token mounted automatically. Call the API server by hand to show
there's no `kubectl` magic — it's just HTTPS + the same authorizer:

```bash
kubectl exec -n rbac-lab alice-shell -- sh -c '
  curl -s --cacert /var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
       -H "Authorization: Bearer $(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
       https://kubernetes.default.svc/api/v1/namespaces/rbac-lab/pods | head -c 200'
# -> a real PodList JSON

kubectl exec -n rbac-lab alice-shell -- sh -c '
  curl -s --cacert /var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
       -H "Authorization: Bearer $(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
       https://kubernetes.default.svc/api/v1/namespaces/rbac-lab/secrets'
# -> {"kind":"Status","status":"Failure","message":"secrets is forbidden: ..."}
```

Same identity, same checks — `kubectl`, curl, or any client library.

## Step 7 — discuss

- **Escalation protection**: alice can't grant herself more rights —
  `kubectl auth can-i create rolebindings -n rbac-lab --as=$A` → no. You also
  can't bind a role containing verbs you don't have yourself.
- **`kubectl create token alice -n rbac-lab`** creates a time-limited token you
  can paste into a kubeconfig — that's how CI systems and developers outside
  the cluster authenticate.
- **apiGroups cheat**: `""` core (pods, services, secrets, nodes) · `apps`
  (deployments, statefulsets) · `batch` (jobs, cronjobs) · `networking.k8s.io`
  (networkpolicies, ingresses) · `rbac.authorization.k8s.io` (roles themselves).
  Check any resource: `kubectl api-resources --namespaced=false`.

## Cleanup

```bash
kubectl delete namespace rbac-lab
kubectl delete clusterrolebinding alice-node-viewer
kubectl delete clusterrole node-viewer
```

## Cheatsheet

```bash
kubectl auth can-i <verb> <resource> -n <ns> --as=system:serviceaccount:<ns>:<name>
kubectl auth can-i --list -n <ns> --as=<user>
kubectl get rolebindings,clusterrolebindings -A          # who is bound where
kubectl describe role <name> -n <ns>                     # rendered rules
kubectl create token <sa> -n <ns>                        # time-limited SA token
```
