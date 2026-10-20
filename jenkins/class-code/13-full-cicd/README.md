# 13 - Full CI/CD Pipeline

```
Quality gates (parallel: lint, unit+junit, hadolint)
  -> Build image -> Container test (retry) -> Trivy scan
  -> Push (main / tags) -> Deploy dev with Helm + helm test (main)
  -> Approve (tags) -> Deploy prod (tags)
```

Setup:
1. Multibranch pipeline on this repo, script path `jenkins/class-code/13-full-cicd/Jenkinsfile`
2. Credentials `dockerhub-creds`, `kubeconfig`
3. Change `IMAGE` to your Docker Hub repo
4. Push to a feature branch → only CI; merge to `main` → deploy dev; tag `v1.0.0` → approval + prod

Run locally first:
```bash
cd app && pip install -r requirements.txt pytest && pytest
docker build -t jokes:local . && docker run --rm -p 5000:5000 jokes:local
helm lint ../chart
```
