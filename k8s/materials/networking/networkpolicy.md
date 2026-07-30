# NetworkPolicy

## What is a NetworkPolicy?

A NetworkPolicy controls the network traffic flow between Pods. By default, all Pods can communicate with each other. NetworkPolicies allow you to restrict ingress (incoming) and egress (outgoing) traffic.

---

## Key Concepts

- Controls Pod-to-Pod communication
- Uses label selectors to target Pods
- Requires a CNI plugin that supports NetworkPolicies (Calico, Cilium, Weave)
- Without any policy, all traffic is allowed
- Once a policy targets a Pod, all non-matching traffic is denied

---

## Deny All Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: default
spec:
  podSelector: {}
  policyTypes:
    - Ingress
```

---

## Deny All Egress

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-egress
  namespace: default
spec:
  podSelector: {}
  policyTypes:
    - Egress
```

---

## Allow Specific Ingress

Allow traffic only from Pods with label `role: frontend` to Pods with label `app: api`.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              role: frontend
      ports:
        - protocol: TCP
          port: 8080
```

---

## Allow Traffic from a Namespace

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-monitoring
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
```

---

## Allow Egress to Specific IPs

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external-db
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Egress
  egress:
    - to:
        - ipBlock:
            cidr: 10.0.0.0/24
      ports:
        - protocol: TCP
          port: 5432
```

---

## Allow DNS Egress

Always allow DNS so Pods can resolve names.

```yaml
egress:
  - to:
      - namespaceSelector: {}
    ports:
      - protocol: UDP
        port: 53
      - protocol: TCP
        port: 53
```

---

## Common kubectl Commands

```bash
kubectl apply -f networkpolicy.yaml
kubectl get networkpolicies
kubectl get netpol
kubectl describe netpol deny-all-ingress
kubectl delete netpol deny-all-ingress
```

---
