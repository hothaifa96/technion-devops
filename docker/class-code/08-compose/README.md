# Demo 08 - Compose

```bash
docker compose up -d --build
docker compose ps
curl localhost:5000
docker compose exec web python -c "import socket; print(socket.gethostbyname('redis'))"
docker compose --profile debug up -d       # adds redis-ui on :8081
docker compose up -d --scale web=1
docker compose logs -f
docker compose down -v
```
