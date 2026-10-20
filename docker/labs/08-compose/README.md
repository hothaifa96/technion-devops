# Lab 08: Docker Compose - Put It All Together

## Objective

Convert everything from labs 01-07 (Dockerfile, run flags, volumes, networks, multi-stage) into a single `compose.yaml`.

## Prerequisites

- Read [materials/09-compose.md](../../materials/09-compose.md)

## Exercise

Build a 3-tier "todo" application:

```
browser ──▶ frontend (nginx, :8080) ──/api──▶ api (python/node, :5000) ──▶ db (postgres)
```

1. **db**: `postgres:16-alpine`, named volume `db-data`, healthcheck with `pg_isready`, not published to the host.
2. **api**: built from `./api` with a multi-stage Dockerfile, env from `.env`, `depends_on` db with `condition: service_healthy`, restart policy `unless-stopped`.
3. **frontend**: built from `./frontend` (multi-stage -> nginx), nginx config proxies `/api` to `http://api:5000`.
4. Two networks: `front-net` (frontend + api) and `back-net` (api + db). The frontend must **not** be able to reach the db.
5. An optional `adminer` service under the profile `debug`.

### Verify
- `docker compose up -d --build` starts everything
- Add a todo in the browser, `docker compose down`, `up -d` again - the todo is still there
- `docker compose exec frontend ping db` fails
- `docker compose down -v` deletes the data

## Challenge Exercise

1. Scale the api to 3 replicas and show that nginx load-balances between them.
2. Add resource limits (`deploy.resources.limits`) to every service.
3. Use a `compose.override.yaml` for development that bind-mounts the source code with hot reload.

## Deliverables
`compose.yaml`, Dockerfiles, nginx config, README with run instructions.
