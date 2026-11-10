# Tutorial: NetworkPolicy step by step

Learn pod firewalls by breaking things on purpose. Every step ends with a
prediction ("what do you think happens?") — run the tests and check.

**Who talks to whom?**

```
namespace np-lab                                namespace np-other
┌────────────────────────────────────────────┐   ┌───────────────────┐
│ client   ubuntu (curl, nslookup, nc)       │   │ outsider ubuntu   │
│ intruder busybox (wget)   <- the bad guy   │   │ stranger busybox  │
│ web      busybox httpd on :8080            │   └───────────────────┘
│ db       busybox httpd on :5432 (fake DB)  │
└────────────────────────────────────────────┘

Goal: client --> web --> db, nothing else, plus internet only for client.
```

## Step 0 — prerequisites

A NetworkPolicy is only a *wish* until the CNI plugin enforces it. Docker's
bridge, kind's default CNI, and **kindnet** all silently ignore policies.
Calico and Cilium enforce them. That is why we created the cluster with
`--cni=calico`.

```bash
kubectl -n kube-system get pods -l k8s-app=calico-node   # must show one per node
```

## Step 1 — deploy the lab and map the open network

```bash
kubectl apply -f manifests/00-setup.yaml
kubectl wait --for=condition=ready pod --all -n np-lab --timeout=180s
kubectl wait --for=condition=ready pod --all -n np-other --timeout=180s
```

The ubuntu images are bare — give them tools (internet is still allowed!):

```bash
kubectl exec -n np-lab client -- sh -c "apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl dnsutils netcat-openbsd"
kubectl exec -n np-other outsider -- sh -c "apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl dnsutils netcat-openbsd"
```

Test matrix — everything is OPEN because there is not a single policy yet:

```bash
kubectl exec -n np-lab client   -- curl -s -m 3 web:8080              # hello from WEB
kubectl exec -n np-lab client   -- curl -s -m 3 db:5432               # hello from DB
kubectl exec -n np-lab intruder -- wget -qO- -T 3 web:8080
kubectl exec -n np-lab intruder -- wget -qO- -T 3 db:5432             # anyone can reach the DB!
kubectl exec -n np-other outsider -- curl -s -m 3 web.np-lab:8080     # even other namespaces
kubectl exec -n np-lab client   -- curl -s -m 3 -o /dev/null -w '%{http_code}' https://google.com   # 200
```

> **Teaching point.** Flat network: any pod can reach any pod in any namespace.
> The DB is one `wget` away from an "intruder" pod.

## Step 2 — default-deny ingress: the walls go up

```bash
kubectl apply -f manifests/01-default-deny-ingress.yaml
kubectl exec -n np-lab client -- curl -s -m 3 web:8080     # times out
kubectl exec -n np-lab client -- curl -s -m 3 db:5432      # times out
```

`podSelector: {}` selects **all** pods in the namespace; `policyTypes:
[Ingress]` with no `ingress:` rules means *allow nothing in*. Notice the
requests **time out** — the packets are dropped, not refused (ICMP "connection
refused" would also tell an attacker something).

But DNS still works! Egress is untouched:

```bash
kubectl exec -n np-lab client -- nslookup web    # resolves fine
```

## Step 3 — open one door: client → web

```bash
kubectl apply -f manifests/02-allow-client-to-web.yaml
kubectl exec -n np-lab client   -- curl -s -m 3 web:8080   # OPEN
kubectl exec -n np-lab intruder -- wget -qO- -T 3 web:8080 # still BLOCKED
kubectl exec -n np-lab client   -- curl -s -m 3 db:5432    # still BLOCKED
```

Policies are **additive**: each policy adds allowed traffic, nothing is
subtracted. And a `podSelector` with no `namespaceSelector` means *pods in my
own namespace*.

## Step 4 — web → db, and the client is denied

```bash
kubectl apply -f manifests/03-allow-web-to-db.yaml
kubectl exec -n np-lab web      -- wget -qO- -T 3 db:5432   # OPEN
kubectl exec -n np-lab client   -- curl -s -m 3 db:5432     # BLOCKED  <- key point!
kubectl exec -n np-lab intruder -- wget -qO- -T 3 db:5432   # BLOCKED
```

The classic 3-tier rule: clients must go *through* the app tier.

## Step 5 — default-deny egress, and watch DNS die

```bash
kubectl apply -f manifests/04-default-deny-egress.yaml
kubectl exec -n np-lab client -- nslookup -timeout=2 -retry=1 web   # FAILS now!
kubectl exec -n np-lab client -- curl -s -m 3 web:8080              # FAILS (can't even resolve)
```

Egress deny also blocks DNS — the #1 real-world NetworkPolicy bug. Fix it:

```bash
kubectl apply -f manifests/05-allow-dns-egress.yaml
kubectl exec -n np-lab client -- nslookup web    # resolves again
```

Look at the `to:` block in `05-allow-dns-egress.yaml`: `namespaceSelector` and
`podSelector` in the **same list item** = AND = "kube-dns pods in kube-system".

## Step 6 — re-open the app flows on egress

A connection now needs **two** permissions: egress on the sender *and* ingress
on the receiver.

```bash
kubectl apply -f manifests/06-allow-app-egress.yaml
kubectl exec -n np-lab client -- curl -s -m 3 web:8080    # OPEN (egress+ingress)
kubectl exec -n np-lab client -- curl -s -m 3 db:5432     # BLOCKED (client has no egress to db)
kubectl exec -n np-lab web    -- wget -qO- -T 3 db:5432   # OPEN
```

## Step 7 — internet egress with ipBlock

`web` and `db` should never talk to the internet. `client` may need it
(`apt-get`, external APIs):

```bash
kubectl apply -f manifests/07-allow-client-internet.yaml
kubectl exec -n np-lab client   -- curl -s -m 5 -o /dev/null -w '%{http_code}' https://google.com  # 200
kubectl exec -n np-lab intruder -- wget -qO- -T 3 http://example.com                               # BLOCKED
kubectl exec -n np-lab client   -- curl -s -m 3 db:5432                                            # still BLOCKED
```

The `except:` list carves private ranges (and the cloud metadata address
`169.254.169.254`) out of `0.0.0.0/0` — that's what keeps pod-to-pod traffic
dead even though "everything" is allowed.

## Step 8 — cross-namespace AND vs OR (the famous gotcha)

Allow `outsider` (np-other) to reach `web` — one combined selector:

```bash
kubectl apply -f manifests/08a-cross-namespace-AND.yaml
kubectl exec -n np-other outsider -- curl -s -m 3 web.np-lab:8080      # OPEN
kubectl exec -n np-other stranger -- wget -qO- -T 3 web.np-lab:8080    # BLOCKED
```

Now change **a single dash** — `podSelector` becomes a second list item (OR):

```bash
kubectl apply -f manifests/08b-cross-namespace-OR.yaml
kubectl exec -n np-other stranger -- wget -qO- -T 3 web.np-lab:8080    # now OPEN!
```

| YAML shape | meaning |
|---|---|
| `- nsSel + podSel` (one item) | AND: matching pods *inside* the matching namespace |
| `- nsSel` `- podSel` (two items) | OR: every pod in the namespace **or** matching pods in my namespace |

A bare `podSelector` always means *my namespace only* — it can never select
pods elsewhere.

## Step 9 — discuss: what did we NOT control?

- `kubectl port-forward` still works — it comes **from the kubelet on the
  node**, not from a pod, so `podSelector`/`namespaceSelector` can't filter it.
  Only `ipBlock` would.
- NetworkPolicy = L3/L4 only (IP + port). No hostnames, no HTTP paths — that's
  a service mesh / ingress job.
- The return traffic of an *allowed ingress* flow is permitted automatically —
  policies are stateful on the flow level, you don't write "reply" rules.

## Cleanup

```bash
kubectl delete namespace np-lab np-other
```

## Cheatsheet

```bash
kubectl get netpol -A                                   # all policies
kubectl describe netpol <name> -n <ns>                  # rendered rules
kubectl get pods -n np-lab --show-labels                # selectors need labels!
# test one flow fast:
kubectl exec -n np-lab client -- curl -s -m 3 <svc>:<port> && echo OPEN || echo BLOCKED
```
