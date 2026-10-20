# Kubernetes - Full Cheat Sheet

> Command-focused companion: [../kubectl-cheatsheet.md](../kubectl-cheatsheet.md) · Multi-node minikube: [../minikube-multinode-cheatsheet.md](../minikube-multinode-cheatsheet.md)

## Architecture

| Component | Where | Job |
|-----------|-------|-----|
| kube-apiserver | control plane | REST front door (6443), AuthN → AuthZ → Admission → etcd |
| etcd | control plane | key-value store of all state (back it up!) |
| kube-scheduler | control plane | assigns Pods to nodes (filter → score → bind) |
| kube-controller-manager | control plane | control loops: Deployment, ReplicaSet, Node, Job, EndpointSlice... |
| cloud-controller-manager | control plane | LoadBalancers, node lifecycle with the cloud |
| kubelet | every node | runs Pods via CRI, probes, volumes, status |
| kube-proxy | every node | Service → Pod rules (iptables/IPVS) |
| container runtime | every node | containerd / CRI-O |
| CNI plugin | every node | Pod networking (Calico, Cilium, Flannel, AWS VPC CNI) |
| CoreDNS | kube-system | cluster DNS |

**kubectl apply → API server → etcd → controller creates RS/Pods → scheduler binds → kubelet runs → EndpointSlice → kube-proxy.**

Static pods: `/etc/kubernetes/manifests` (kubeadm/minikube control plane).

---

## kubectl essentials

```bash
kubectl config get-contexts | use-context <ctx> | current-context
kubectl config set-context --current --namespace=dev
kubectl cluster-info
kubectl api-resources [--namespaced=true]
kubectl explain deployment.spec.strategy --recursive

kubectl get pods|po [-n ns|-A] [-o wide|yaml|json|name] [-l app=web] [-w] [--show-labels]
kubectl get all -n dev
kubectl get events --sort-by=.metadata.creationTimestamp [-n dev]
kubectl describe pod <pod>
kubectl logs <pod> [-c container] [-f] [--previous] [--tail 100] [--since 10m]
kubectl logs -l app=web --prefix --all-containers
kubectl exec -it <pod> [-c c] -- sh
kubectl port-forward svc/web 8080:80
kubectl cp <pod>:/path ./local
kubectl top node | pod [--containers]          # needs metrics-server
kubectl debug -it <pod> --image=busybox --target=<container>
kubectl debug node/<node> -it --image=busybox
kubectl run tmp --rm -it --image=nicolaka/netshoot -- bash

kubectl apply -f file.yaml | -f dir/ | -k overlay/
kubectl apply -f x.yaml --dry-run=server
kubectl diff -f x.yaml
kubectl delete -f file.yaml | pod <name> [--grace-period=0 --force]
kubectl edit deploy web
kubectl patch deploy web -p '{"spec":{"replicas":3}}'
kubectl label pod web tier=frontend [--overwrite] | tier-
kubectl annotate deploy web kubernetes.io/change-cause="v2"
```

### Generate YAML fast

```bash
kubectl create deployment web --image=nginx --replicas=3 --port=80 --dry-run=client -o yaml > deploy.yaml
kubectl expose deployment web --port=80 --target-port=80 --type=ClusterIP --dry-run=client -o yaml
kubectl run debug --image=busybox --restart=Never --dry-run=client -o yaml -- sleep 3600
kubectl create configmap app --from-literal=K=V --from-file=app.conf --dry-run=client -o yaml
kubectl create secret generic db --from-literal=password=pw --dry-run=client -o yaml
kubectl create secret docker-registry regcred --docker-server=... --docker-username=... --docker-password=...
kubectl create secret tls web-tls --cert=tls.crt --key=tls.key
kubectl create job once --image=busybox -- echo hi
kubectl create cronjob tick --image=busybox --schedule="*/5 * * * *" -- date
kubectl create namespace dev
kubectl create serviceaccount ci -n dev
kubectl create role pod-reader --verb=get,list,watch --resource=pods -n dev
kubectl create rolebinding ci-read --role=pod-reader --serviceaccount=dev:ci -n dev
kubectl create ingress web --rule="app.local/*=web:80" --class=nginx
kubectl autoscale deploy web --min=2 --max=10 --cpu-percent=70
```

### JSONPath / custom columns

```bash
kubectl get pod web -o jsonpath='{.status.podIP}'
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.nodeName}{"\n"}{end}'
kubectl get nodes -o custom-columns=NAME:.metadata.name,IP:.status.addresses[0].address
kubectl get secret db -o jsonpath='{.data.password}' | base64 -d
kubectl get pods --field-selector=status.phase!=Running
kubectl get pods --sort-by=.status.containerStatuses[0].restartCount
```

---

## Workloads - YAML templates

### Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
  labels: { app: web }
spec:
  containers:
    - name: web
      image: nginx:1.27
      ports: [{ containerPort: 80 }]
      env:
        - { name: MODE, value: prod }
      resources:
        requests: { cpu: 100m, memory: 64Mi }
        limits:   { cpu: 500m, memory: 128Mi }
  restartPolicy: Always        # Always | OnFailure | Never
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  revisionHistoryLimit: 10
  strategy:
    type: RollingUpdate        # or Recreate
    rollingUpdate: { maxSurge: 25%, maxUnavailable: 0 }
  selector:
    matchLabels: { app: web }  # MUST match template labels
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports: [{ name: http, containerPort: 80 }]
          readinessProbe: { httpGet: { path: /, port: http }, periodSeconds: 5 }
          livenessProbe:  { httpGet: { path: /, port: http }, periodSeconds: 10 }
          resources:
            requests: { cpu: 100m, memory: 64Mi }
            limits:   { memory: 128Mi }
```

```bash
kubectl set image deploy/web web=nginx:1.27.1
kubectl rollout status|history|pause|resume|restart deploy/web
kubectl rollout undo deploy/web [--to-revision=2]
kubectl scale deploy web --replicas=5
```

### StatefulSet + headless Service

```yaml
apiVersion: v1
kind: Service
metadata: { name: db }
spec:
  clusterIP: None
  selector: { app: db }
  ports: [{ port: 5432 }]
---
apiVersion: apps/v1
kind: StatefulSet
metadata: { name: db }
spec:
  serviceName: db
  replicas: 3
  selector: { matchLabels: { app: db } }
  template:
    metadata: { labels: { app: db } }
    spec:
      containers:
        - name: postgres
          image: postgres:16
          volumeMounts: [{ name: data, mountPath: /var/lib/postgresql/data }]
  volumeClaimTemplates:
    - metadata: { name: data }
      spec:
        accessModes: [ReadWriteOnce]
        resources: { requests: { storage: 1Gi } }
```

Pods `db-0, db-1, db-2` · DNS `db-0.db.<ns>.svc.cluster.local` · ordered start/stop · PVC per pod kept on scale-down.

### DaemonSet

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata: { name: agent }
spec:
  selector: { matchLabels: { app: agent } }
  template:
    metadata: { labels: { app: agent } }
    spec:
      tolerations: [{ key: node-role.kubernetes.io/control-plane, operator: Exists, effect: NoSchedule }]
      containers: [{ name: agent, image: prom/node-exporter }]
```

### Job & CronJob

```yaml
apiVersion: batch/v1
kind: Job
metadata: { name: migrate }
spec:
  completions: 1
  parallelism: 1
  backoffLimit: 3
  activeDeadlineSeconds: 600
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: Never        # Never | OnFailure (NOT Always)
      containers: [{ name: m, image: myapp:1.0, command: ["python", "migrate.py"] }]
---
apiVersion: batch/v1
kind: CronJob
metadata: { name: backup }
spec:
  schedule: "0 2 * * *"           # min hour dom month dow
  timeZone: "Asia/Jerusalem"
  concurrencyPolicy: Forbid       # Allow | Forbid | Replace
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers: [{ name: b, image: postgres:16, command: ["sh", "-c", "pg_dump ..."] }]
```

```bash
kubectl create job now --from=cronjob/backup
kubectl patch cj backup -p '{"spec":{"suspend":true}}'
```

### Workload comparison

| | Deployment | StatefulSet | DaemonSet | Job | CronJob |
|---|---|---|---|---|---|
| Pod names | random | ordinal `-0..N` | per node | random | per run |
| Storage | shared/none | PVC per pod | hostPath typical | ephemeral | ephemeral |
| Use | stateless apps | DBs, queues | agents | batch | scheduled batch |

---

## Probes, resources, QoS

| Probe | Failure → |
|-------|-----------|
| startupProbe | restart; other probes wait until it succeeds |
| livenessProbe | restart container |
| readinessProbe | removed from Service endpoints |

Mechanisms: `httpGet`, `tcpSocket`, `exec`, `grpc` · fields `initialDelaySeconds periodSeconds timeoutSeconds failureThreshold successThreshold`.

| Exceeds | CPU limit | Memory limit |
|---------|-----------|--------------|
| Result | throttled | OOMKilled (137) |

| QoS | Rule | Evicted |
|-----|------|---------|
| Guaranteed | requests = limits (cpu+mem, all containers) | last |
| Burstable | some requests/limits | middle |
| BestEffort | none | first |

```yaml
apiVersion: v1
kind: LimitRange
metadata: { name: defaults, namespace: dev }
spec:
  limits:
    - type: Container
      default:        { cpu: 500m, memory: 256Mi }
      defaultRequest: { cpu: 100m, memory: 128Mi }
---
apiVersion: v1
kind: ResourceQuota
metadata: { name: quota, namespace: dev }
spec:
  hard: { pods: "20", requests.cpu: "4", requests.memory: 8Gi, limits.memory: 16Gi }
```

---

## Scheduling

```yaml
spec:
  nodeSelector: { disktype: ssd }
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions: [{ key: zone, operator: In, values: [a, b] }]
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector: { matchLabels: { app: web } }
            topologyKey: kubernetes.io/hostname
  tolerations:
    - { key: dedicated, operator: Equal, value: db, effect: NoSchedule }
  topologySpreadConstraints:
    - { maxSkew: 1, topologyKey: topology.kubernetes.io/zone, whenUnsatisfiable: DoNotSchedule, labelSelector: { matchLabels: { app: web } } }
  priorityClassName: high
```

```bash
kubectl label node n1 disktype=ssd
kubectl taint node n1 dedicated=db:NoSchedule      # NoSchedule | PreferNoSchedule | NoExecute
kubectl taint node n1 dedicated=db:NoSchedule-     # remove
kubectl cordon n1 ; kubectl drain n1 --ignore-daemonsets --delete-emptydir-data ; kubectl uncordon n1
```

PodDisruptionBudget: `spec: { minAvailable: 2, selector: { matchLabels: { app: web } } }`.

---

## Networking

| Service type | Reach |
|--------------|-------|
| ClusterIP | inside cluster |
| NodePort | `<nodeIP>:30000-32767` |
| LoadBalancer | cloud LB (minikube: `minikube tunnel`) |
| ExternalName | DNS CNAME |
| Headless `clusterIP: None` | DNS → Pod IPs |

```yaml
apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  type: ClusterIP
  selector: { app: web }
  ports: [{ name: http, port: 80, targetPort: http }]   # targetPort = number or container port NAME
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web
  annotations: { nginx.ingress.kubernetes.io/rewrite-target: / }
spec:
  ingressClassName: nginx
  tls: [{ hosts: [app.example.com], secretName: web-tls }]
  rules:
    - host: app.example.com
      http:
        paths:
          - { path: /api, pathType: Prefix, backend: { service: { name: api, port: { number: 80 } } } }
          - { path: /,    pathType: Prefix, backend: { service: { name: web, port: { number: 80 } } } }
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: api-from-web, namespace: shop }
spec:
  podSelector: { matchLabels: { app: api } }
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector: { matchLabels: { app: web } }
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: monitoring } }
      ports: [{ protocol: TCP, port: 80 }]
```

Default deny: `podSelector: {}` + `policyTypes: [Ingress, Egress]` → then allow DNS (UDP/TCP 53 to kube-system).

DNS: `svc` · `svc.ns` · `svc.ns.svc.cluster.local` · `pod-0.svc.ns.svc.cluster.local`.

```bash
minikube addons enable ingress
kubectl get svc,endpoints,endpointslices,ingress
```

---

## Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: app }
data:
  LOG_LEVEL: info
  app.conf: |
    key=value
---
apiVersion: v1
kind: Secret
metadata: { name: db }
type: Opaque
stringData: { password: S3cr3t }          # data: needs base64
---
# consuming
spec:
  containers:
    - name: app
      envFrom:
        - configMapRef: { name: app }
        - secretRef:    { name: db }
      env:
        - name: DB_PASSWORD
          valueFrom: { secretKeyRef: { name: db, key: password } }
        - name: NODE_NAME
          valueFrom: { fieldRef: { fieldPath: spec.nodeName } }
      volumeMounts:
        - { name: cfg, mountPath: /etc/app }
        - { name: cfg, mountPath: /etc/nginx/nginx.conf, subPath: app.conf }
  volumes:
    - name: cfg
      configMap: { name: app }
    - name: sec
      secret: { secretName: db, defaultMode: 0400 }
```

Env vars don't update on change; mounted files do (~1 min, not with `subPath`). Secrets are **base64, not encrypted** → RBAC, encryption at rest, External Secrets / Sealed Secrets / Vault.

---

## Storage

| Object | Who | What |
|--------|-----|------|
| PersistentVolume | admin / provisioner | actual storage, cluster-scoped |
| PersistentVolumeClaim | developer | request (size, access mode) |
| StorageClass | admin | dynamic provisioning template |

| Access mode | |
|------|---|
| RWO | one node read-write |
| ROX | many nodes read-only |
| RWX | many nodes read-write (NFS/EFS) |
| RWOP | one Pod |

Reclaim: `Delete` (default dynamic) · `Retain`. Binding: `Immediate` · `WaitForFirstConsumer`.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: data }
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: standard
  resources: { requests: { storage: 1Gi } }
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: { name: fast }
provisioner: ebs.csi.aws.com
parameters: { type: gp3 }
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

Ephemeral volumes: `emptyDir: {}` (Pod lifetime, `medium: Memory`), `hostPath`, `configMap`, `secret`, `projected`.

---

## Security

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role                       # ClusterRole for cluster-wide / non-namespaced
metadata: { name: pod-reader, namespace: dev }
rules:
  - apiGroups: [""]              # core: pods, services, configmaps, secrets
    resources: [pods, pods/log]
    verbs: [get, list, watch]
  - apiGroups: [apps]            # deployments, statefulsets, daemonsets
    resources: [deployments]
    verbs: [get, list, create, update, patch, delete]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { name: ci-read, namespace: dev }
subjects:
  - { kind: ServiceAccount, name: ci, namespace: dev }
  - { kind: User, name: dana, apiGroup: rbac.authorization.k8s.io }
roleRef: { kind: Role, name: pod-reader, apiGroup: rbac.authorization.k8s.io }
```

```bash
kubectl auth can-i list pods -n dev --as=system:serviceaccount:dev:ci
kubectl auth can-i --list -n dev --as=dana
kubectl create token ci -n dev --duration=1h
```

Built-in ClusterRoles: `view`, `edit`, `admin`, `cluster-admin`.

```yaml
spec:
  serviceAccountName: ci
  automountServiceAccountToken: false
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    fsGroup: 10001
    seccompProfile: { type: RuntimeDefault }
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities: { drop: [ALL] }
```

Pod Security Admission labels on Namespace: `pod-security.kubernetes.io/enforce|warn|audit: privileged|baseline|restricted`.

---

## Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: web }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: web }
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
  behavior:
    scaleDown: { stabilizationWindowSeconds: 300 }
```

`desired = ceil(current × currentMetric / target)` · needs metrics-server + **requests**. HPA (pods) · VPA (requests) · Cluster Autoscaler / Karpenter (nodes) · KEDA (events).

---

## Pod status / errors → fix

| Status | Typical cause | Check |
|--------|---------------|-------|
| `Pending` | no node fits (resources, taints, affinity, PVC unbound) | `describe pod` Events |
| `ContainerCreating` (stuck) | volume / secret / configmap missing, CNI | Events |
| `ImagePullBackOff` / `ErrImagePull` | wrong image/tag, private registry | image name, `imagePullSecrets` |
| `CrashLoopBackOff` | app exits / bad command / failing liveness | `logs --previous` |
| `OOMKilled` | memory limit too low | `describe` Last State, raise limit |
| `CreateContainerConfigError` | missing ConfigMap/Secret key | Events |
| `Running` but 0/1 Ready | readiness probe failing | probe path/port |
| `Terminating` forever | finalizers / node gone | `--grace-period=0 --force` |
| `Evicted` | node pressure | `describe node` |
| Service no traffic | selector ≠ labels, wrong targetPort, not Ready, NetworkPolicy | `get endpoints` |

**Debug order:** `get` → `describe` → `logs [--previous]` → `exec` / `debug` → `get events` → node (`describe node`, `top`).

---

## Useful aliases

```bash
alias k=kubectl
alias kgp='kubectl get pods'
alias kd='kubectl describe'
alias kaf='kubectl apply -f'
export do="--dry-run=client -o yaml"      # k create deploy x --image=nginx $do
source <(kubectl completion bash)         # or zsh
complete -o default -F __start_kubectl k
```

Tools: `k9s`, `kubectx`/`kubens`, `stern` (multi-pod logs), `kubeconform`, `kustomize`, `helm`.
