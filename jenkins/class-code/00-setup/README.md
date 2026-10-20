# 00 - Local Jenkins Setup

```bash
docker compose up -d --build
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
open http://localhost:8080
```

1. Paste the initial password → *Install suggested plugins* (the ones in `plugins.txt` are pre-installed)
2. Create admin user
3. Manage Jenkins → Credentials → add:
   - `dockerhub-creds` (username/password - use a Docker Hub **access token**)
   - `slack-token` (secret text) - optional
   - `kubeconfig` (secret file) - optional
4. Verify Docker works: create a pipeline job with `sh 'docker ps'`

## Optional inbound agent

1. Manage Jenkins → Nodes → New node `agent1`, labels `linux docker`, launch method *inbound*
2. Copy the secret → `echo AGENT1_SECRET=<secret> > .env`
3. `docker compose --profile agent up -d`

## Jenkins on Kubernetes (alternative)

```bash
helm repo add jenkins https://charts.jenkins.io
helm install jenkins jenkins/jenkins -n jenkins --create-namespace
kubectl -n jenkins get secret jenkins -o jsonpath='{.data.jenkins-admin-password}' | base64 -d
kubectl -n jenkins port-forward svc/jenkins 8080:8080
```
