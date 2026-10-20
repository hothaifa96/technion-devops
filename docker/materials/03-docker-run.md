# docker run

`docker run` = `docker create` + `docker start` (+ `docker pull` if the image is missing).

```bash
docker run [OPTIONS] IMAGE[:TAG] [COMMAND] [ARGS...]
```

---

## Most Used Flags

| Flag | Meaning | Example |
|------|---------|---------|
| `-d` | Detached (background) | `docker run -d nginx` |
| `-it` | Interactive + TTY | `docker run -it ubuntu bash` |
| `--name` | Container name | `--name web` |
| `-p host:container` | Publish port | `-p 8080:80` |
| `-P` | Publish all EXPOSEd ports to random ports | `-P` |
| `-e KEY=VAL` | Env variable | `-e DB_HOST=db` |
| `--env-file` | Env vars from file | `--env-file .env` |
| `-v` / `--mount` | Volumes / bind mounts | `-v data:/var/lib/mysql` |
| `--network` | Attach to network | `--network app-net` |
| `--rm` | Remove container on exit | `docker run --rm alpine echo hi` |
| `--restart` | Restart policy | `--restart unless-stopped` |
| `-w` | Working dir | `-w /app` |
| `-u` | User | `-u 1000:1000` |
| `--entrypoint` | Override ENTRYPOINT | `--entrypoint sh` |
| `--memory`, `--cpus` | Resource limits | `--memory 256m --cpus 0.5` |
| `--read-only` | Read-only root FS | `--read-only` |
| `--health-cmd` | Health check | `--health-cmd "curl -f localhost"` |

---

## Restart Policies

| Policy | Behaviour |
|--------|-----------|
| `no` (default) | Never restart |
| `on-failure[:N]` | Restart on non-zero exit (max N times) |
| `always` | Always restart, also after daemon restart |
| `unless-stopped` | Like always, except if manually stopped |

---

## Port Publishing

```
          host                     container
  curl localhost:8080  ──▶  -p 8080:80  ──▶  nginx :80
```

```bash
docker run -d -p 8080:80 nginx               # all interfaces
docker run -d -p 127.0.0.1:8080:80 nginx     # localhost only
docker port <container>
```

---

## Managing Containers

```bash
docker ps                 # running
docker ps -a              # all
docker logs -f --tail 50 web
docker exec -it web sh    # shell inside running container
docker stop web           # SIGTERM, then SIGKILL after 10s
docker kill web           # SIGKILL immediately
docker start web
docker restart web
docker rm -f web
docker inspect web
docker inspect -f '{{.NetworkSettings.IPAddress}}' web
docker stats              # live CPU/mem
docker top web
docker cp web:/etc/nginx/nginx.conf ./nginx.conf
docker container prune    # remove all stopped containers
docker system prune -a    # remove everything unused
```

---

## Overriding CMD / ENTRYPOINT

```bash
docker run alpine echo "hello"            # replaces CMD
docker run --entrypoint sh -it my-app     # replaces ENTRYPOINT
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Application error |
| 125 | Docker daemon error |
| 126 | Command cannot be invoked |
| 127 | Command not found |
| 137 | Killed (SIGKILL / OOM) |
| 143 | Terminated (SIGTERM) |
