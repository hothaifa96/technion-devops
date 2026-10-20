# Cluster Networking: CNI, kube-proxy & DNS

## The Kubernetes network model

1. Every Pod has a unique IP
2. Pods communicate with all other Pods without NAT (across nodes)
3. Containers in the same Pod share an IP and talk via `localhost`

```
 Node 1 (10.0.1.10)                       Node 2 (10.0.1.11)
 ┌───────────────────────┐                ┌───────────────────────┐
 │ Pod A 10.244.1.5      │  ── CNI ──▶    │ Pod B 10.244.2.7      │
 │ Pod C 10.244.1.6      │  (overlay /    │ Pod D 10.244.2.8      │
 └───────────────────────┘   routing)     └───────────────────────┘
```

---

## Four communication types

| From → To | Solved by |
|-----------|-----------|
| Container → Container (same Pod) | shared network namespace (`localhost`) |
| Pod → Pod | CNI plugin |
| Pod → Service | kube-proxy + CoreDNS |
| External → Service | NodePort / LoadBalancer / Ingress / Gateway API |

---

## CNI plugins

| Plugin | Highlights |
|--------|-----------|
| Flannel | Simple overlay (VXLAN), no NetworkPolicy |
| Calico | BGP routing, NetworkPolicy |
| Cilium | eBPF, NetworkPolicy L3-L7, observability (Hubble) |
| AWS VPC CNI | Pods get real VPC IPs (EKS) |

> NetworkPolicies only work if the CNI supports them.

---

## Services & kube-proxy recap

```
client pod ──▶ ClusterIP 10.96.0.15:80 ──(iptables DNAT)──▶ one of the pod IPs :8080
```

| Type | Reachable from |
|------|---------------|
| ClusterIP | inside the cluster |
| NodePort | `<NodeIP>:30000-32767` |
| LoadBalancer | cloud LB external IP |
| ExternalName | DNS CNAME to external host |
| Headless (`clusterIP: None`) | DNS returns pod IPs directly (StatefulSets) |

---

## CoreDNS

Runs as a Deployment in `kube-system`. Every pod's `/etc/resolv.conf` points at it.

| Record | Resolves to |
|--------|-------------|
| `my-svc` | same namespace service |
| `my-svc.my-ns` | service in another namespace |
| `my-svc.my-ns.svc.cluster.local` | FQDN |
| `pod-0.my-headless.my-ns.svc.cluster.local` | a StatefulSet pod |

```bash
kubectl run tmp --rm -it --image=busybox:1.36 -- sh
cat /etc/resolv.conf
nslookup kubernetes.default
nslookup my-svc.my-ns
```

---

## Ingress vs Gateway API

- **Ingress** - L7 HTTP routing by host/path, requires an Ingress Controller (nginx, traefik, ALB)
- **Gateway API** - successor of Ingress: `GatewayClass`, `Gateway`, `HTTPRoute`; role oriented and more expressive

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: web
spec:
  parentRefs:
    - name: main-gateway
  hostnames: ["app.example.com"]
  rules:
    - matches:
        - path: { type: PathPrefix, value: /api }
      backendRefs:
        - name: api-svc
          port: 80
```

---

## Debugging network issues

```bash
kubectl get svc,endpoints,endpointslices
kubectl run debug --rm -it --image=nicolaka/netshoot -- bash
#   curl my-svc:80 ; dig my-svc ; nc -zv db 5432
kubectl port-forward svc/my-svc 8080:80
kubectl get networkpolicy -A
```

Checklist: selector labels match? `targetPort` correct? Pod `Ready`? NetworkPolicy blocking? DNS ok?
