#!/usr/bin/env bash
# Demo 06 - buildx & multi-platform. Replace DOCKER_USER with your Docker Hub user.
DOCKER_USER=${DOCKER_USER:-myuser}

docker buildx version
docker buildx ls

# 1. builder with docker-container driver (supports multi-platform + cache export)
docker buildx create --name multi --driver docker-container --use
docker buildx inspect --bootstrap

# 2. build for the local platform and load into docker
docker buildx build -t buildx-demo:local --load .
docker run --rm -p 5000:5000 -d --name bx buildx-demo:local && sleep 2 && curl localhost:5000 && docker rm -f bx

# 3. build for a foreign platform (QEMU emulation) and run it
docker buildx build --platform linux/amd64 -t buildx-demo:amd64 --load .
docker run --rm --platform linux/amd64 buildx-demo:amd64 cat /info.txt

# 4. multi-platform + push (manifest list)
docker login
docker buildx build --platform linux/amd64,linux/arm64 -t "$DOCKER_USER/buildx-demo:1.0" --push .
docker buildx imagetools inspect "$DOCKER_USER/buildx-demo:1.0"

# 5. registry cache
docker buildx build --platform linux/amd64,linux/arm64 \
  --cache-to type=registry,ref="$DOCKER_USER/buildx-demo:cache",mode=max \
  --cache-from type=registry,ref="$DOCKER_USER/buildx-demo:cache" \
  -t "$DOCKER_USER/buildx-demo:1.1" --push .

# cleanup
docker buildx use default
docker buildx rm multi
