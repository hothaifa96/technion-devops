# Docker Buildx & BuildKit

## BuildKit

The modern build engine (default since Docker 23). Features:
- Parallel stage execution
- Skips unused stages
- Better caching (`--mount=type=cache`)
- Build secrets (`--mount=type=secret`)
- Multi-platform builds

## Buildx

`docker buildx` is the CLI plugin that exposes all BuildKit features.

```bash
docker buildx version
docker buildx ls                 # list builders and supported platforms
```

---

## Multi-platform Images

Apple Silicon = `linux/arm64`, most cloud servers = `linux/amd64`. An image built on a Mac may fail on EC2 with `exec format error`.

```bash
# create a builder that supports multi-platform (docker-container driver)
docker buildx create --name multi --driver docker-container --use
docker buildx inspect --bootstrap

# build for 2 platforms and push a manifest list
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myuser/app:1.0 \
  --push .

docker buildx imagetools inspect myuser/app:1.0
```

> Multi-platform results cannot be `--load`ed into the local image store (classic store); use `--push` or `--output type=oci,dest=app.tar`.

```
             myuser/app:1.0  (manifest list)
               ├── linux/amd64  -> sha256:aaa
               └── linux/arm64  -> sha256:bbb
```

---

## Platform build args

```dockerfile
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS build
ARG TARGETOS TARGETARCH
WORKDIR /src
COPY . .
RUN GOOS=$TARGETOS GOARCH=$TARGETARCH go build -o /out/app .

FROM alpine
COPY --from=build /out/app /app
ENTRYPOINT ["/app"]
```

| ARG | Example |
|-----|---------|
| `BUILDPLATFORM` | linux/arm64 (machine running build) |
| `TARGETPLATFORM` | linux/amd64 |
| `TARGETOS` / `TARGETARCH` | linux / amd64 |

---

## Cache mounts

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt
RUN --mount=type=cache,target=/root/.npm npm ci
```

## Build secrets (never baked in a layer)

```dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
```
```bash
docker buildx build --secret id=npmrc,src=$HOME/.npmrc .
```

## Remote cache (CI)

```bash
docker buildx build \
  --cache-from type=registry,ref=myuser/app:cache \
  --cache-to type=registry,ref=myuser/app:cache,mode=max \
  -t myuser/app:1.0 --push .
```

---

## Bake (build many images from one file)

```hcl
# docker-bake.hcl
group "default" { targets = ["api", "web"] }
target "api" { context = "./api"  tags = ["myuser/api:latest"] platforms = ["linux/amd64","linux/arm64"] }
target "web" { context = "./web"  tags = ["myuser/web:latest"] }
```
```bash
docker buildx bake --push
```
