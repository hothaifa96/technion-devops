# Kubernetes

```
k8s/
├── materials/          # theory (index: materials/README.md)
├── archeticture/       # cluster & node overview diagrams
├── class-code/         # live demos per lecture
├── labs/               # homework labs per topic
├── system-preperation/ # minikube / k3s / eks / kubectl setup
└── pdfs/               # lecture slides
```

## Topics → Material → Demo → Lab

| Topic | Material | Class Code | Lab |
|-------|----------|------------|-----|
| Control plane & worker nodes | [control-plane](materials/architecture/control-plane.md), [worker-node](materials/architecture/worker-node.md) | [lecture0-architecture](class-code/lecture0-architecture) | [architecture](labs/architecture/lab1.md) |
| Pods | [pod](materials/workloads/pod.md) | [lecture1](class-code/lecture1) | [pods](labs/pods) |
| ReplicaSet / Deployment / Namespace | [deployment](materials/workloads/deployment.md), [rollouts](materials/workloads/rollout-strategies.md) | [lecture2](class-code/lecture2) | [deployment](labs/deployment) |
| ConfigMap & Secret | [configmap](materials/configuration/configmap.md), [secret](materials/configuration/secret.md) | [lecture3](class-code/lecture3) | [configmap](labs/configmap/lab1.md), [secrets](labs/secrets/lab1.md) |
| Services & DNS | [service](materials/networking/service.md), [cluster-networking](materials/networking/cluster-networking.md) | [lecture2/whoami](class-code/lecture2/whoami) | [services](labs/services/lab1.md) |
| Ingress | [ingress](materials/networking/ingress.md) | [lecture4-ingress](class-code/lecture4-ingress) | [ingress](labs/ingress), [chat-microservices](labs/chat-microservices) |
| HPA | [hpa](materials/scaling/hpa.md) | [lecture5-hpa](class-code/lecture5-hpa) | [hpa](labs/hpa/lab1.md) |
| Storage | [pv](materials/storage/pv.md), [pvc](materials/storage/pvc.md), [storageclass](materials/storage/storageclass.md) | [lecture6-pv](class-code/lecture6-pv) | [storage](labs/storage/lab1.md) |
| Jobs & CronJobs | [job](materials/workloads/job.md) | [lecture7-jobs](class-code/lecture7-jobs) | [jobs](labs/jobs/lab1.md) |
| Probes & Resources | [probes](materials/workloads/probes.md), [resources-qos](materials/workloads/resources-qos.md) | [lecture8-probes-resources](class-code/lecture8-probes-resources) | [probes-resources](labs/probes-resources/lab1.md) |
| StatefulSet & DaemonSet | [statefulset](materials/workloads/statefulset.md), [daemonset](materials/workloads/daemonset.md) | [lecture9-statefulset-daemonset](class-code/lecture9-statefulset-daemonset) | [statefulset-daemonset](labs/statefulset-daemonset/lab1.md) |
| Security | [rbac](materials/security/rbac.md), [serviceaccount](materials/security/serviceaccount.md), [security-context](materials/security/security-context.md), [pod-security](materials/security/pod-security.md) | [lecture10-security](class-code/lecture10-security) | [rbac](labs/security/lab1-rbac.md), [pod-security](labs/security/lab2-pod-security.md) |
| NetworkPolicy | [networkpolicy](materials/networking/networkpolicy.md) | [lecture11-networkpolicy](class-code/lecture11-networkpolicy) | [networkpolicy](labs/networkpolicy/lab1.md) |
| Scheduling | [scheduling](materials/scheduling/scheduling.md) | [lecture12-scheduling](class-code/lecture12-scheduling) | [scheduling](labs/scheduling/lab1.md) |

Cheatsheets: [full Kubernetes cheat sheet](materials/cheatsheet.md), [kubectl](kubectl-cheatsheet.md), [minikube multinode](minikube-multinode-cheatsheet.md)
