# Dockerfile

A Dockerfile is a text file with instructions that `docker build` executes top to bottom. Every instruction that changes the filesystem creates a **layer**.

---

## Example

```dockerfile
FROM python:3.12-slim

LABEL maintainer="devops@technion.ac.il"

ENV PYTHONUNBUFFERED=1 \
    APP_PORT=5000

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

```bash
docker build -t my-app:1.0 .
docker build -t my-app:1.0 -f docker/Dockerfile.prod .
docker build --build-arg VERSION=2.0 -t my-app:2.0 .
docker build --no-cache -t my-app:1.0 .
```

---

## Instructions Reference

| Instruction | Purpose | Example |
|-------------|---------|---------|
| `FROM` | Base image (must be first) | `FROM node:20-alpine` |
| `WORKDIR` | Set working dir (creates it) | `WORKDIR /app` |
| `COPY` | Copy files from build context | `COPY src/ ./src/` |
| `ADD` | Like COPY + URLs + auto-extract tar | `ADD app.tar.gz /opt/` |
| `RUN` | Execute command at **build** time | `RUN apt-get update && apt-get install -y curl` |
| `CMD` | Default command at **run** time (overridable) | `CMD ["npm", "start"]` |
| `ENTRYPOINT` | Fixed executable at run time | `ENTRYPOINT ["python"]` |
| `ENV` | Env var (build + run time) | `ENV NODE_ENV=production` |
| `ARG` | Variable at **build** time only | `ARG VERSION=1.0` |
| `EXPOSE` | Documents the port (does not publish!) | `EXPOSE 8080` |
| `USER` | Run as user | `USER appuser` |
| `VOLUME` | Declare mount point | `VOLUME /data` |
| `HEALTHCHECK` | Container health command | `HEALTHCHECK CMD curl -f localhost/health` |
| `LABEL` | Metadata | `LABEL version="1.0"` |
| `SHELL` | Change default shell | `SHELL ["/bin/bash", "-c"]` |

---

## CMD vs ENTRYPOINT

| Dockerfile | `docker run img` | `docker run img hello.py` |
|---|---|---|
| `CMD ["python", "app.py"]` | python app.py | hello.py (CMD replaced) |
| `ENTRYPOINT ["python", "app.py"]` | python app.py | python app.py hello.py |
| `ENTRYPOINT ["python"]` + `CMD ["app.py"]` | python app.py | python hello.py |

> Rule: ENTRYPOINT = the executable, CMD = default arguments.

### Shell form vs Exec form

```dockerfile
CMD python app.py          # shell form -> /bin/sh -c "python app.py" (PID 1 is sh, signals not forwarded)
CMD ["python", "app.py"]   # exec form  -> python is PID 1 (preferred)
```

---

## ARG vs ENV

```dockerfile
ARG VERSION=1.0            # only during build
ENV APP_VERSION=$VERSION   # persist into runtime
```

```bash
docker build --build-arg VERSION=2.0 .
docker run -e APP_VERSION=3.0 img      # ENV can be overridden at run time
```

---

## Build Context & .dockerignore

The **build context** is the directory sent to the daemon (`.` in `docker build .`). Exclude junk:

```
# .dockerignore
.git
node_modules
__pycache__
*.log
.env
Dockerfile
```

---

## Layer Caching

Docker reuses a layer if the instruction **and** its inputs did not change. Once one layer changes, all following layers rebuild.

```dockerfile
# BAD - any code change reinstalls dependencies
COPY . .
RUN pip install -r requirements.txt

# GOOD - deps cached until requirements.txt changes
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

---

## HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1
```

`docker ps` shows `(healthy)` / `(unhealthy)`.

---

## Inspecting Images

```bash
docker history my-app:1.0       # layers and sizes
docker inspect my-app:1.0       # full metadata (JSON)
docker image ls
docker tag my-app:1.0 myuser/my-app:1.0
docker push myuser/my-app:1.0
```
