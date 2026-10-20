# Docker Volumes & Storage

A container's writable layer is **deleted with the container**. To persist or share data use mounts.

---

## Mount Types

```
                      ┌────────────── HOST ──────────────────┐
                      │                                      │
 named volume  ──▶    │ /var/lib/docker/volumes/<name>/_data │  managed by Docker
 bind mount    ──▶    │ /home/user/project (any path)        │  managed by you
 tmpfs         ──▶    │ RAM only                             │  never on disk
                      └──────────────────────────────────────┘
```

| Type | Use case | Example |
|------|----------|---------|
| **Named volume** | DB data, persistence in prod | `-v pgdata:/var/lib/postgresql/data` |
| **Anonymous volume** | Throwaway data, `VOLUME` in Dockerfile | `-v /data` |
| **Bind mount** | Dev: live code reload, config files | `-v $(pwd):/app` |
| **tmpfs** | Secrets / scratch in memory | `--tmpfs /tmp` |

---

## Volume Commands

```bash
docker volume create mydata
docker volume ls
docker volume inspect mydata
docker volume rm mydata
docker volume prune
```

---

## -v vs --mount

```bash
# short syntax
docker run -d -v mydata:/data nginx
docker run -d -v $(pwd)/html:/usr/share/nginx/html:ro nginx

# explicit syntax (recommended in scripts)
docker run -d --mount type=volume,source=mydata,target=/data nginx
docker run -d --mount type=bind,source=$(pwd)/html,target=/usr/share/nginx/html,readonly nginx
docker run -d --mount type=tmpfs,target=/cache,tmpfs-size=64m nginx
```

> `-v` with a non-existing host path **creates a directory**; `--mount type=bind` **fails** - safer.

---

## Sharing data between containers

```bash
docker volume create shared
docker run -d --name writer -v shared:/data alpine sh -c 'while true; do date >> /data/log.txt; sleep 2; done'
docker run --rm -v shared:/data alpine tail -f /data/log.txt
```

---

## Backup & Restore a Volume

```bash
# backup
docker run --rm -v pgdata:/source -v $(pwd):/backup alpine \
  tar czf /backup/pgdata.tar.gz -C /source .

# restore
docker run --rm -v pgdata:/target -v $(pwd):/backup alpine \
  tar xzf /backup/pgdata.tar.gz -C /target
```

---

## Permissions gotcha

Bind mounts keep the host UID/GID. If the container runs as a non-root user (e.g. UID 1000) it needs permissions on the host folder:

```bash
docker run -u $(id -u):$(id -g) -v $(pwd):/work alpine touch /work/file
```

---

## VOLUME in Dockerfile

```dockerfile
VOLUME /var/lib/mysql
```

Creates an anonymous volume each run unless you mount something over it. Note: any `RUN` changes after `VOLUME` to that path are discarded.
