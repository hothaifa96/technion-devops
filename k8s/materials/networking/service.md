# Service

## What is a Service?

A Service is an abstraction that defines a logical set of Pods and a policy to access them. Services provide stable networking for Pods, which have dynamic IPs.

---

## Key Concepts

- Provides a stable IP and DNS name for a set of Pods
- Load balances traffic across matching Pods
- Uses label selectors to find target Pods
- Decouples consumers from the actual Pod IPs

---

## 4 Types of Services

| Type | Description |
|------|-------------|
| ClusterIP | Internal only (default) |
| NodePort | Exposes on each node's IP at a static port |
| LoadBalancer | Provisions external load balancer (cloud) |
| ExternalName | Maps to an external DNS name |

---

## Type 1: ClusterIP (Default)

Only accessible within the cluster.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
```

### Use Cases
- Internal microservice communication
- Backend services not exposed externally

---

## Type 2: NodePort

Exposes the service on a static port on every node.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-nodeport-service
spec:
  type: NodePort
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
      nodePort: 30080
```

### Port Range
- NodePort range: 30000–32767
- Access: `http://<NodeIP>:<NodePort>`

### Use Cases
- Development and testing
- When you don't have a cloud load balancer

---

## Type 3: LoadBalancer

Provisions an external load balancer (cloud providers: AWS, GCP, Azure).

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-lb-service
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
```

### Use Cases
- Production traffic from the internet
- Cloud-based Kubernetes clusters

---

## Type 4: ExternalName

Maps a service to an external DNS name. No proxying happens.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: db.example.com
```

### Use Cases
- Pointing to external databases or APIs
- Migration from external to internal services

---

## Port Definitions

| Field | Description |
|-------|-------------|
| port | Port the Service listens on |
| targetPort | Port on the Pod container |
| nodePort | Port on the Node (NodePort type only) |

---

## Multi-Port Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: multi-port-service
spec:
  selector:
    app: myapp
  ports:
    - name: http
      port: 80
      targetPort: 8080
    - name: https
      port: 443
      targetPort: 8443
```

---

## Service DNS

Within the cluster, services are accessible via DNS:

```
<service-name>.<namespace>.svc.cluster.local
```

Example:
```bash
curl http://my-service.default.svc.cluster.local
```

---

## Headless Service

A service with `clusterIP: None`. Returns Pod IPs directly (used with StatefulSets).

```yaml
apiVersion: v1
kind: Service
metadata:
  name: headless-service
spec:
  clusterIP: None
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
```

---

## Common kubectl Commands

```bash
kubectl apply -f service.yaml
kubectl get services
kubectl get svc
kubectl describe svc my-service
kubectl delete svc my-service
```

---
