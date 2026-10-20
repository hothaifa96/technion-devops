#!/usr/bin/env bash
# Demo 02 - docker run. Run line by line in class.

# --- foreground vs detached ---
docker run alpine echo "hello world"
docker run -d --name web nginx:alpine
docker ps

# --- interactive ---
docker run -it --rm ubuntu:24.04 bash
#   inside: cat /etc/os-release; ps aux; exit

# --- ports ---
docker run -d --name web2 -p 8080:80 nginx:alpine
curl -s localhost:8080 | head -5
docker port web2

# --- env vars ---
docker run --rm -e NAME=technion alpine sh -c 'echo "hello $NAME"'
printf "DB_HOST=db\nDB_PORT=5432\n" > /tmp/demo.env
docker run --rm --env-file /tmp/demo.env alpine env | grep DB_

# --- logs / exec / inspect ---
docker logs -f web2              # Ctrl+C
docker exec -it web2 sh          # ls /usr/share/nginx/html
docker inspect -f '{{.State.Status}} {{.NetworkSettings.IPAddress}}' web2
docker stats --no-stream

# --- restart policies ---
docker run -d --name crasher --restart on-failure:3 alpine sh -c 'echo crash; exit 1'
sleep 5; docker inspect -f '{{.RestartCount}}' crasher

# --- resource limits & OOM (exit 137) ---
docker run --rm --memory 20m --name oom python:3.12-alpine python -c "x=' '*100_000_000"
echo "exit code: $?"

# --- override entrypoint ---
docker run --rm --entrypoint cat nginx:alpine /etc/nginx/nginx.conf | head

# --- stop vs kill ---
time docker stop web     # SIGTERM -> graceful
docker kill web2         # SIGKILL

# --- cleanup ---
docker rm -f web web2 crasher 2>/dev/null
docker container prune -f
