# Lab 1: NetworkPolicy - Zero Trust Inside the Cluster

## Objective

Lock down pod-to-pod traffic with NetworkPolicies.

## Prerequisites

- `minikube start --cni=calico -p netpol`
- Read [networkpolicy.md](../../materials/networking/networkpolicy.md)

## Setup

Deploy a 3-tier app in namespace `shop`:
- `web` (nginx, label `tier=web`)
- `api` (traefik/whoami, label `tier=api`, Service `api:80`)
- `db` (redis, label `tier=db`, Service `db:6379`)

And a `hacker` pod (curlimages/curl) in namespace `default`.

## Exercise

### Step 1: Baseline
Prove that today everyone can talk to everyone (web->db, hacker->db, hacker->api).

### Step 2: Default deny
1. Apply a default-deny **ingress** policy in `shop`. Test again.
2. Apply a default-deny **egress** policy. Why does `curl api` now fail even from `web` with a DNS error?
3. Add a policy allowing DNS egress to `kube-system` on port 53.

### Step 3: Allow the right flows
- `web` -> `api:80` only
- `api` -> `db:6379` only
- Nothing else. `web` must NOT reach `db`.

### Step 4: Cross namespace
1. Create namespace `monitoring` with a pod `prometheus` (curl image).
2. Allow `monitoring` to reach `api:80` (namespaceSelector).
3. What's the difference between:
   ```yaml
   - from:
     - namespaceSelector: {...}
       podSelector: {...}
   ```
   and
   ```yaml
   - from:
     - namespaceSelector: {...}
     - podSelector: {...}
   ```
   Test both.

### Step 5: Egress to the internet
Allow only `api` to reach `0.0.0.0/0` on port 443 except `169.254.169.254/32` (cloud metadata).

## Challenge Exercise

1. Draw the traffic matrix (who can reach whom) before and after.
2. Use Cilium's Hubble or Calico logs to see dropped packets.

## Deliverables
Policies + matrix + test commands.
