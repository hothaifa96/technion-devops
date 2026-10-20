# Docker Best Practices

## Image Size & Build Speed

| # | Practice | Why |
|---|----------|-----|
| 1 | Use small, **pinned** base images (`python:3.12-slim`, not `python:latest`) | reproducible + smaller |
| 2 | Multi-stage builds | ship only runtime artifacts |
| 3 | Order instructions from least to most frequently changing | layer cache |
| 4 | Combine `RUN` commands and clean caches in the same layer | fewer/smaller layers |
| 5 | Use `.dockerignore` | smaller context, no secrets leaked |
| 6 | `pip install --no-cache-dir`, `npm ci --omit=dev`, `apt-get ... --no-install-recommends` | smaller |

```dockerfile
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
```

---

## Security

| # | Practice |
|---|----------|
| 1 | **Don't run as root** - add `USER` |
| 2 | Never put secrets in the image (`ENV PASSWORD=...`, `COPY .env`) - use runtime env / secrets / `--mount=type=secret` |
| 3 | Scan images: `docker scout cves img`, `trivy image img` |
| 4 | Use official / verified images, pin by digest for critical images `FROM nginx@sha256:...` |
| 5 | Minimal images (distroless/alpine) = fewer CVEs |
| 6 | Run with `--read-only`, `--cap-drop ALL`, `--security-opt no-new-privileges` |
| 7 | Prefer `COPY` over `ADD` |

```dockerfile
RUN addgroup --system app && adduser --system --ingroup app app
USER app
```

---

## Runtime

| # | Practice |
|---|----------|
| 1 | One process (concern) per container |
| 2 | Use exec-form `CMD ["..."]` so PID 1 receives SIGTERM (graceful shutdown) |
| 3 | Log to **stdout/stderr**, not files |
| 4 | Add `HEALTHCHECK` |
| 5 | Set resource limits (`--memory`, `--cpus`) |
| 6 | Config via environment variables (12-factor) |
| 7 | Containers are **ephemeral** - persist state in volumes |

---

## Tagging

- Never deploy `:latest` - use semantic version or git SHA: `app:1.4.2`, `app:sha-3f2a1bc`
- Tags are mutable, digests are immutable

---

## Linting

```bash
docker run --rm -i hadolint/hadolint < Dockerfile
```

---

## Bad vs Good

```dockerfile
# BAD
FROM python
COPY . .
RUN pip install -r requirements.txt
ENV DB_PASSWORD=supersecret
CMD python app.py
```

```dockerfile
# GOOD
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -r -u 10001 app
USER app
EXPOSE 5000
HEALTHCHECK CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:5000/health')"
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
```
