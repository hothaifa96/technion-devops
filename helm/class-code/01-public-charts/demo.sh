#!/usr/bin/env bash
# Demo 01 - Using public charts: repo, search, show, install, upgrade, rollback, uninstall

helm version

# --- repos ---
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm search repo nginx
helm search repo bitnami/nginx --versions | head

# --- inspect before installing ---
helm show chart bitnami/nginx
helm show values bitnami/nginx | less
helm pull bitnami/nginx --untar && ls nginx && rm -rf nginx

# --- install ---
helm install web bitnami/nginx -n helm-demo --create-namespace \
  --set service.type=ClusterIP --set replicaCount=2
helm list -n helm-demo
kubectl get all -n helm-demo
helm status web -n helm-demo

# --- release state lives in secrets ---
kubectl get secrets -n helm-demo -l owner=helm

# --- upgrade with a values file ---
cat > /tmp/web-values.yaml <<'EOF'
replicaCount: 3
serverBlock: |-
  server {
    listen 0.0.0.0:8080;
    location / { return 200 "hello from helm values\n"; }
  }
EOF
helm upgrade web bitnami/nginx -n helm-demo -f /tmp/web-values.yaml
helm get values web -n helm-demo
kubectl -n helm-demo run curl --rm -it --image=curlimages/curl --restart=Never -- curl -s web

# --- history & rollback ---
helm history web -n helm-demo
helm rollback web 1 -n helm-demo
helm history web -n helm-demo
helm get values web -n helm-demo

# --- render without installing ---
helm template web bitnami/nginx --set replicaCount=5 | grep -A2 "kind: Deployment"

# --- cleanup ---
helm uninstall web -n helm-demo
kubectl delete ns helm-demo
