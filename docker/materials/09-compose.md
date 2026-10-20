# Docker Compose

Define and run multi-container applications with one YAML file.

```yaml
# compose.yaml
services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      MONGO_URL: mongodb://mongo:27017/app
    depends_on:
      mongo:
        condition: service_healthy
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      retries: 5

volumes:
  mongo-data:
```

- Compose creates a default network `<project>_default` - services reach each other by **service name**
- Named volumes are prefixed with the project name

---

## Commands

```bash
docker compose up -d
docker compose up -d --build
docker compose ps
docker compose logs -f api
docker compose exec api sh
docker compose stop
docker compose down          # remove containers + network
docker compose down -v       # also remove volumes
docker compose config        # render final config
docker compose up -d --scale api=3
```

---

## Useful keys

| Key | Purpose |
|-----|---------|
| `build` / `image` | build from Dockerfile or use image |
| `ports` | publish ports |
| `environment` / `env_file` | env variables |
| `volumes` | mounts |
| `networks` | custom networks |
| `depends_on` | start order (+ health condition) |
| `healthcheck` | health command |
| `restart` | restart policy |
| `profiles` | optional services (`--profile debug`) |
| `deploy.resources` | cpu / memory limits |

---

## Variable substitution

```yaml
services:
  web:
    image: "nginx:${NGINX_TAG:-alpine}"
```

`.env` file next to `compose.yaml` is loaded automatically.
