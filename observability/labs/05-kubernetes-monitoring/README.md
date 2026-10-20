# Lab 05: Prometheus Connections - Service Discovery & Kubernetes

## Objective

Let Prometheus discover targets automatically and monitor applications running on Kubernetes with the Prometheus Operator.

## Prerequisites

- Read [07-connections.md](../../materials/07-connections.md)
- Reference: [prometheus-kubernetes](../../prometheus-kubernetes), [traffic-gen](../../traffic-gen), [class-code/05-pushgateway](../../class-code/05-pushgateway)
- minikube with 4GB+ memory

## Part A - kube-prometheus-stack
1. Install `prometheus-community/kube-prometheus-stack` in namespace `monitoring` with your own values file (Grafana NodePort, retention 3d).
2. Port-forward Prometheus and Grafana. How many targets are there? Which components are scraped?
3. List the CRDs installed by the operator (`kubectl get crd | grep monitoring`).

## Part B - ServiceMonitor
1. Deploy the instrumented shop app ([class-code/02-python-client](../../class-code/02-python-client)) to namespace `dev` (Deployment 3 replicas + Service with a **named** port `http`).
2. Create a ServiceMonitor. Find out which label your Prometheus requires (`kubectl get prometheus -n monitoring -o yaml | grep -A3 serviceMonitorSelector`).
3. Verify 3 targets appear (one per pod). Which labels did the operator add (`namespace`, `pod`, `service`...)?
4. Deploy the [traffic-gen CronJob](../../traffic-gen/cronjob.yaml) to produce load.

## Part C - PodMonitor & annotations
1. Deploy a second app without a Service and scrape it with a `PodMonitor`.
2. Explain the difference between ServiceMonitor and PodMonitor.

## Part D - PrometheusRule
Create a `PrometheusRule` with:
- recording rule for RPS per pod
- alert `ShopPodRestarting`: `increase(kube_pod_container_status_restarts_total{namespace="dev"}[10m]) > 2`
- alert `ShopHighErrorRate`
Trigger the restart alert by killing a container in a loop.

## Part E - Kubernetes queries
1. CPU and memory per pod in `dev` (cAdvisor metrics).
2. Pods not in `Running` phase (`kube_pod_status_phase`).
3. Deployments where available replicas < desired (`kube_deployment_*`).
4. Node allocatable vs requested CPU.

## Part F - Pushgateway
Deploy the Pushgateway in the cluster and a CronJob that runs [batch_job.py](../../class-code/05-pushgateway/batch_job.py) every 2 minutes. Scrape it with a ServiceMonitor (`honorLabels: true`).

## Challenge Exercise

1. Without the operator, write a raw `kubernetes_sd_configs` (role `pod`) scrape job with relabeling that keeps only pods annotated `prometheus.io/scrape: "true"`.
2. Configure `remote_write` to a second Prometheus / VictoriaMetrics and query it.

## Deliverables
Values file, ServiceMonitor, PodMonitor, PrometheusRule, queries, screenshots.
