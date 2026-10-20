# Flask Prometheus Metrics Demo

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

In another terminal, generate traffic:

```bash
curl http://localhost:5000/
curl http://localhost:5000/work
curl 'http://localhost:5000/process?count=10'
curl 'http://localhost:5000/cache?hit=true'
curl 'http://localhost:5000/cache?hit=false'
curl http://localhost:5000/users
curl http://localhost:5000/simulate-error
curl http://localhost:5000/metrics
```

## Build and run in Minikube

Build the image directly into Minikube's image store:

```bash
eval "$(minikube docker-env)"
docker build -t flask-prometheus:1.0 .
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl rollout status deployment/flask-prometheus
```

If your Minikube driver does not support `minikube docker-env`, use:

```bash
docker build -t flask-prometheus:1.0 .
minikube image load flask-prometheus:1.0
```

Test the app locally through port-forward:

```bash
kubectl port-forward svc/flask-prometheus 5000:5000
```

Then use the curl commands above.

## Enable Prometheus scraping

This ServiceMonitor assumes you installed `kube-prometheus-stack` with Helm release `monitoring`, and that its Prometheus instance selects ServiceMonitors with label `release: monitoring`.

```bash
kubectl apply -f k8s/servicemonitor.yaml
kubectl get servicemonitor -n monitoring
```

In Prometheus, open **Status -> Targets** and look for the Flask endpoint. If it does not appear, inspect the Prometheus custom resource's `serviceMonitorSelector` and namespace selector:

```bash
kubectl get prometheus -n monitoring
kubectl describe prometheus -n monitoring
```

If you installed the standalone `prometheus-community/prometheus` chart instead, it does not automatically provide the Prometheus Operator's ServiceMonitor discovery. Configure a scrape job for the Flask service in that chart's Prometheus configuration instead.

## Useful Grafana PromQL

Requests per second:

```promql
sum(rate(http_requests_total[5m]))
```

5xx error percentage:

```promql
100 * sum(rate(http_requests_total{status=~"5.."}[5m]))
  / clamp_min(sum(rate(http_requests_total[5m])), 1e-9)
```

95th percentile HTTP latency:

```promql
histogram_quantile(
  0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

Business operation 95th percentile:

```promql
histogram_quantile(
  0.95,
  sum by (le, operation) (
    rate(app_business_operation_duration_seconds_bucket[5m])
  )
)
```

Items processed per second:

```promql
sum by (item_type) (rate(app_items_processed_total[5m]))
```

Cache hit ratio:

```promql
sum(rate(app_cache_requests_total{outcome="hit"}[5m]))
/
clamp_min(sum(rate(app_cache_requests_total[5m])), 1e-9)
```

Active requests:

```promql
http_requests_in_progress
```

Note: metrics are process-local. With multiple Gunicorn workers, use a Prometheus multiprocess setup or a single worker; this demo uses one worker to keep metric behavior straightforward. The active-users gauge is simulated for demonstration.
