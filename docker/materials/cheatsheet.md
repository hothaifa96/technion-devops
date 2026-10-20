# Docker - Full Cheat Sheet

## Concepts at a glance

| Term                        | One-liner                                                             |
| --------------------------- | --------------------------------------------------------------------- |
| Image                       | Read-only, layered template (`name:tag`, immutable `@sha256:` digest) |
| Container                   | Running instance of an image + thin writable layer                    |
| Registry / Repo / Tag       | Docker Hub · `myuser/app` · `1.4.2`                                   |
| Dockerfile                  | Build recipe, one layer per FS-changing instruction                   |
| Build context               | Folder sent to the builder (`.`), filtered by `.dockerignore`         |
| Volume                      | Persistent storage managed by Docker                                  |
| Network                     | Virtual network, built-in DNS on user-defined networks                |
| dockerd → containerd → runc | daemon → lifecycle → OCI runtime                                      |
| Namespaces / cgroups        | isolation (what you see) / limits (what you use)                      |

---

## Images

```bash
docker build -t app:1.0 .                         # build from ./Dockerfile
docker build -t app:1.0 -f docker/Dockerfile.prod .
docker build --build-arg VERSION=2.0 -t app:2.0 .
docker build --no-cache --pull -t app:1.0 .
docker build --target test -t app:test .          # stop at a stage
docker images                                     # = docker image ls
docker image ls --filter dangling=true
docker pull nginx:1.27-alpine
docker tag app:1.0 myuser/app:1.0
docker login -u myuser                            # use an access token
docker push myuser/app:1.0
docker history app:1.0                            # layers + sizes
docker history --no-trunc app:1.0
docker inspect app:1.0
docker inspect -f '{{.Config.Env}}' app:1.0
docker rmi app:1.0                                # = docker image rm
docker image prune                                # dangling
docker image prune -a                             # all unused
docker save app:1.0 -o app.tar && docker load -i app.tar
docker scout quickview app:1.0                    # CVE scan (or: trivy image app:1.0)
```

---

## Dockerfile instructions

| Instruction   | Time      | Example                                         | Notes                                           |
| ------------- | --------- | ----------------------------------------------- | ----------------------------------------------- |
| `FROM`        | build     | `FROM python:3.12-slim AS base`                 | first instruction; `AS` names a stage           |
| `ARG`         | build     | `ARG VERSION=1.0`                               | only during build (before FROM = only for FROM) |
| `ENV`         | build+run | `ENV PORT=5000`                                 | persists into containers                        |
| `WORKDIR`     | build     | `WORKDIR /app`                                  | creates dir                                     |
| `COPY`        | build     | `COPY --chown=app:app src/ ./src/`              | prefer over ADD                                 |
| `ADD`         | build     | `ADD app.tar.gz /opt/`                          | auto-extract / URLs                             |
| `RUN`         | build     | `RUN apt-get update && apt-get install -y curl` | new layer                                       |
| `USER`        | build+run | `USER 10001`                                    | non-root                                        |
| `EXPOSE`      | doc       | `EXPOSE 5000`                                   | documentation only                              |
| `VOLUME`      | run       | `VOLUME /data`                                  | anonymous volume                                |
| `HEALTHCHECK` | run       | `HEALTHCHECK CMD curl -f localhost:5000/health` | `(healthy)` in ps                               |
| `ENTRYPOINT`  | run       | `ENTRYPOINT ["python"]`                         | fixed executable                                |
| `CMD`         | run       | `CMD ["app.py"]`                                | default args, overridable                       |
| `LABEL`       | meta      | `LABEL org.opencontainers.image.source=...`     |                                                 |
| `SHELL`       | build     | `SHELL ["/bin/bash", "-c"]`                     |                                                 |
| `STOPSIGNAL`  | run       | `STOPSIGNAL SIGINT`                             |                                                 |
| `ONBUILD`     | build     | `ONBUILD COPY . .`                              | for base images                                 |

### CMD vs ENTRYPOINT

| Dockerfile                       | `docker run img` | `docker run img x` |
| -------------------------------- | ---------------- | ------------------ |
| `CMD ["a","b"]`                  | a b              | x                  |
| `ENTRYPOINT ["a","b"]`           | a b              | a b x              |
| `ENTRYPOINT ["a"]` + `CMD ["b"]` | a b              | a x                |

Exec form `["a","b"]` → PID 1 gets signals. Shell form `a b` → `/bin/sh -c "a b"`.

### Template - Python

```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt
COPY . .
RUN useradd -r -u 10001 app
USER app
EXPOSE 5000
HEALTHCHECK CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:5000/health')"
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
```

### Template - Node (multi-stage)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Template - Go (static → distroless)

```dockerfile
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS build
ARG TARGETOS TARGETARCH
WORKDIR /src
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -ldflags="-s -w" -o /out/app .

FROM gcr.io/distroless/static:nonroot
COPY --from=build /out/app /app
USER nonroot
ENTRYPOINT ["/app"]
```

### .dockerignore

```
.git
node_modules
__pycache__
*.log
.env
Dockerfile*
docker-compose*.yml
```

---

## Containers - `docker run`

```bash
docker run [OPTIONS] IMAGE [COMMAND] [ARGS]
```

| Flag                                                          | Meaning                      |
| ------------------------------------------------------------- | ---------------------------- |
| `-d`                                                          | detached                     |
| `-it`                                                         | interactive + TTY            |
| `--name web`                                                  | name                         |
| `--rm`                                                        | remove on exit               |
| `-p 8080:80` / `-p 127.0.0.1:8080:80` / `-P`                  | publish port(s)              |
| `-e K=V` / `--env-file .env`                                  | env vars                     |
| `-v vol:/data` / `-v $(pwd):/app:ro`                          | volume / bind mount          |
| `--mount type=volume,src=vol,dst=/data`                       | explicit mount               |
| `--tmpfs /tmp`                                                | in-memory                    |
| `--network net` / `--network-alias api`                       | network                      |
| `--restart no\|on-failure[:N]\|always\|unless-stopped`        | restart policy               |
| `-u 1000:1000`                                                | user                         |
| `-w /app`                                                     | workdir                      |
| `--entrypoint sh`                                             | override entrypoint          |
| `--memory 256m --cpus 0.5`                                    | limits                       |
| `--read-only --cap-drop ALL --security-opt no-new-privileges` | hardening                    |
| `--platform linux/amd64`                                      | run another arch (emulation) |
| `--health-cmd "curl -f localhost"`                            | healthcheck at runtime       |
| `--add-host host.docker.internal:host-gateway`                | reach host                   |

```bash
docker run -d --name web -p 8080:80 nginx:alpine
docker run -it --rm ubuntu:24.04 bash
docker run --rm -e NAME=dev alpine sh -c 'echo $NAME'
docker run --rm --entrypoint cat nginx:alpine /etc/nginx/nginx.conf
```

## Containers - manage

```bash
docker ps                      # running
docker ps -a                   # all
docker ps -q                   # IDs only
docker ps --filter status=exited --format '{{.Names}}\t{{.Status}}'
docker logs -f --tail 100 web
docker logs --since 10m web
docker exec -it web sh
docker exec web env
docker exec -u root web id
docker inspect web
docker inspect -f '{{.State.Status}} {{.State.ExitCode}} {{.State.OOMKilled}}' web
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' web
docker port web
docker top web
docker stats [--no-stream]
docker cp web:/etc/nginx/nginx.conf .
docker cp ./index.html web:/usr/share/nginx/html/
docker diff web                # changed files in the writable layer
docker stop web                # SIGTERM → 10s → SIGKILL
docker stop -t 30 web
docker kill web                # SIGKILL
docker start | restart | pause | unpause web
docker rename web web-old
docker update --memory 512m --restart always web
docker rm web / docker rm -f web
docker container prune
docker commit web myimg:debug  # snapshot (debug only)
docker wait web                # block until exit, print code
```

### Exit codes

| Code | Meaning               |
| ---- | --------------------- |
| 0    | success               |
| 1    | app error             |
| 125  | docker run error      |
| 126  | not executable        |
| 127  | command not found     |
| 137  | SIGKILL / OOM (128+9) |
| 139  | segfault (128+11)     |
| 143  | SIGTERM (128+15)      |

---

## Volumes & mounts

| Type         | Syntax                               | Use                    |
| ------------ | ------------------------------------ | ---------------------- |
| Named volume | `-v pgdata:/var/lib/postgresql/data` | persistence            |
| Anonymous    | `-v /data`                           | throwaway              |
| Bind mount   | `-v $(pwd)/src:/app/src:ro`          | dev, config            |
| tmpfs        | `--tmpfs /tmp:size=64m`              | secrets/scratch in RAM |

```bash
docker volume create pgdata
docker volume ls
docker volume inspect pgdata          # Mountpoint
docker volume rm pgdata
docker volume prune [-a]

# backup / restore
docker run --rm -v pgdata:/src -v $(pwd):/b alpine tar czf /b/pgdata.tgz -C /src .
docker run --rm -v pgdata:/dst -v $(pwd):/b alpine tar xzf /b/pgdata.tgz -C /dst
```

`-v` with a missing host path creates a dir; `--mount type=bind` fails (safer).

---

## Networks

| Driver              | Use                                                |
| ------------------- | -------------------------------------------------- |
| `bridge` (default)  | single host, NAT; **no DNS on the default bridge** |
| user-defined bridge | DNS by container name ✔                            |
| `host`              | share host network (no `-p`)                       |
| `none`              | no network                                         |
| `overlay`           | multi-host (Swarm)                                 |
| `macvlan`           | own MAC/IP on LAN                                  |

```bash
docker network ls
docker network create app-net
docker network create --subnet 10.10.0.0/24 custom
docker network inspect app-net
docker network connect app-net web
docker network disconnect app-net web
docker network rm app-net
docker network prune
docker run -d --name db --network app-net postgres:16     # reachable as db:5432
docker run --rm -it --network app-net nicolaka/netshoot   # debug: dig, curl, nc
```

Containers on the same network talk on the **container port**; `-p` is only for outside access. DNS server inside containers: `127.0.0.11`.

---

## Buildx / BuildKit

```bash
docker buildx version
docker buildx ls
docker buildx create --name multi --driver docker-container --use
docker buildx inspect --bootstrap
docker buildx build --platform linux/amd64,linux/arm64 -t user/app:1.0 --push .
docker buildx build --platform linux/amd64 -t app:amd64 --load .
docker buildx imagetools inspect user/app:1.0
docker buildx build --cache-from type=registry,ref=user/app:cache \
                    --cache-to type=registry,ref=user/app:cache,mode=max --push -t user/app:1.1 .
docker buildx build --secret id=npmrc,src=$HOME/.npmrc .
docker buildx bake --push
docker buildx prune
docker buildx rm multi
```

| Dockerfile feature | Syntax                                                        |
| ------------------ | ------------------------------------------------------------- |
| cache mount        | `RUN --mount=type=cache,target=/root/.npm npm ci`             |
| secret mount       | `RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci` |
| ssh mount          | `RUN --mount=type=ssh git clone git@github.com:org/x.git`     |
| platform ARGs      | `BUILDPLATFORM TARGETPLATFORM TARGETOS TARGETARCH`            |
| cross-compile      | `FROM --platform=$BUILDPLATFORM ...`                          |

---

## Docker Compose

```yaml
services:
  api:
    build: { context: ./api, target: runtime, args: { VERSION: "1.0" } }
    image: myuser/api:1.0
    ports: ["3000:3000"]
    environment:
      DB_URL: postgres://app:pw@db:5432/app
    env_file: [.env]
    depends_on:
      db: { condition: service_healthy }
    restart: unless-stopped
    networks: [front, back]
    deploy:
      resources: { limits: { cpus: "0.5", memory: 256M } }
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_PASSWORD: pw, POSTGRES_USER: app, POSTGRES_DB: app }
    volumes: [db-data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10
    networks: [back]
  adminer:
    image: adminer
    ports: ["8081:8080"]
    profiles: [debug]
    networks: [back]
volumes:
  db-data:
networks:
  front:
  back:
```

```bash
docker compose up -d [--build] [--scale api=3]
docker compose --profile debug up -d
docker compose ps
docker compose logs -f api
docker compose exec api sh
docker compose run --rm api pytest
docker compose config              # resolved config
docker compose pull | build | restart | stop | start
docker compose down                # remove containers + networks
docker compose down -v --rmi local # + volumes + images
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

`${VAR:-default}` substitution, `.env` next to compose file is auto-loaded, `compose.override.yaml` merged automatically.

---

## Cleanup & disk

```bash
docker system df [-v]
docker system prune              # stopped containers, dangling images, unused networks, build cache
docker system prune -a --volumes # everything unused
docker builder prune -a
```

---

## Best practices checklist

- [ ] Pinned, small base (`*-slim`, `alpine`, distroless); digest for critical images
- [ ] Multi-stage build; final stage only has runtime artifacts
- [ ] Cache-friendly order: deps first, code last
- [ ] One `RUN` for apt with `--no-install-recommends` + `rm -rf /var/lib/apt/lists/*`
- [ ] `.dockerignore`
- [ ] Non-root `USER`
- [ ] No secrets in `ENV`/`ARG`/layers - runtime env or `--mount=type=secret`
- [ ] Exec-form `CMD`/`ENTRYPOINT`, graceful SIGTERM
- [ ] `HEALTHCHECK`, logs to stdout/stderr
- [ ] Immutable tags (semver / git SHA), never deploy `latest`
- [ ] Lint (`hadolint`) + scan (`trivy` / `docker scout`) in CI
- [ ] Run with limits and `--read-only --cap-drop ALL` where possible

---

## Troubleshooting

| Symptom                                           | Check                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| Container exits immediately                       | `docker logs`, `docker ps -a` exit code, CMD runs in foreground? |
| `port is already allocated`                       | `lsof -i :8080`, change host port                                |
| Can't reach other container by name               | same **user-defined** network?                                   |
| Works locally, not on server: `exec format error` | arch mismatch → `buildx --platform`                              |
| Exit 137                                          | `OOMKilled` in inspect → raise `--memory`                        |
| `docker stop` takes 10s                           | shell-form CMD → use exec form                                   |
| Permission denied on bind mount                   | UID mismatch → `-u $(id -u):$(id -g)` / chown                    |
| Build always reinstalls deps                      | instruction order / `.dockerignore`                              |
| `no space left on device`                         | `docker system df`, `docker system prune -a`                     |
| `permission denied ... docker.sock`               | add user to `docker` group / Docker Desktop running              |
