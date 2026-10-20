# Multi-stage Builds

## The Problem

Build tools (compilers, SDKs, dev dependencies) are needed to **build** but not to **run**. Shipping them makes the image big and increases the attack surface.

| Image | Size (approx) |
|-------|------|
| `golang:1.22` | ~800MB |
| `node:20` | ~1.1GB |
| `gcr.io/distroless/static` | ~2MB |
| `nginx:alpine` | ~45MB |

---

## The Solution

Several `FROM` statements in one Dockerfile. Only the **last stage** ends up in the final image; copy only artifacts with `COPY --from=<stage>`.

```dockerfile
# ---------- stage 1: build ----------
FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/server .

# ---------- stage 2: run ----------
FROM gcr.io/distroless/static:nonroot
COPY --from=builder /out/server /server
USER nonroot
ENTRYPOINT ["/server"]
```

Result: ~10MB instead of ~800MB.

---

## Frontend example (React -> nginx)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
```

---

## Python example (wheels)

```dockerfile
FROM python:3.12 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels
COPY . .
CMD ["python", "app.py"]
```

---

## Useful tricks

```bash
# build only a specific stage (e.g. for tests)
docker build --target builder -t app:build .
```

```dockerfile
# a dedicated test stage
FROM builder AS test
RUN go test ./...

# copy from an external image
COPY --from=nginx:alpine /etc/nginx/nginx.conf /nginx.conf
```

---

## Base image choices for the final stage

| Base | Pros | Cons |
|------|------|------|
| `ubuntu` / `debian` | Familiar, tools | Big |
| `*-slim` | Smaller, glibc | Still has shell/apt |
| `alpine` | ~5MB | musl libc can break some binaries |
| `distroless` | No shell, minimal CVEs | Hard to debug |
| `scratch` | Empty | Only for static binaries |
