# Docker Introduction - Images & Containers

## Why Containers?

"It works on my machine" - containers package the **application + runtime + libraries + config** into a single portable unit that runs the same everywhere.

| | Virtual Machine | Container |
|---|---|---|
| Isolation | Full guest OS + hypervisor | Process isolation (namespaces + cgroups) |
| Size | GBs | MBs |
| Boot time | Minutes | Milliseconds |
| Kernel | Own kernel | Shares host kernel |

---

## Core Concepts

| Term | Meaning |
|------|---------|
| **Image** | Read-only template (layers) used to create containers |
| **Container** | A running (or stopped) instance of an image + a thin writable layer |
| **Registry** | Server storing images (Docker Hub, ECR, GHCR, Harbor) |
| **Repository** | Collection of tags of the same image (`nginx`) |
| **Tag** | Version label (`nginx:1.27-alpine`) |
| **Dockerfile** | Recipe used to build an image |

---

## Architecture

```
┌──────────────┐   REST API    ┌──────────────────────────────┐      ┌──────────────┐
│ docker CLI   │ ────────────▶ │ dockerd (Docker daemon)      │ ───▶ │  Registry    │
│ (client)     │               │   └─ containerd              │ pull │ (Docker Hub) │
└──────────────┘               │        └─ runc → container   │ push └──────────────┘
                               └──────────────────────────────┘
```

- **dockerd** - manages images, containers, networks, volumes
- **containerd** - container lifecycle (used directly by Kubernetes)
- **runc** - low-level OCI runtime that actually creates the process

---

## Linux building blocks

- **Namespaces** - what a process can *see*: `pid`, `net`, `mnt`, `uts`, `ipc`, `user`
- **cgroups** - what a process can *use*: CPU, memory, IO limits
- **Union FS (OverlayFS)** - stacked read-only layers + one writable layer

---

## Image Layers

```
┌──────────────────────────┐  ← container writable layer (deleted with container)
├──────────────────────────┤
│ COPY . /app              │  layer 4
│ RUN pip install ...      │  layer 3
│ WORKDIR /app             │  layer 2
│ FROM python:3.12-slim    │  layer 1 (base)
└──────────────────────────┘
```

Layers are cached and shared between images -> faster builds and less disk.

---

## Container Lifecycle

```
created ──start──▶ running ──stop──▶ exited ──rm──▶ (gone)
                     │  ▲
                pause│  │unpause
                     ▼  │
                    paused
```

---

## First Commands

```bash
docker version
docker info
docker pull nginx:alpine
docker images
docker run -d --name web -p 8080:80 nginx:alpine
docker ps
docker logs web
docker exec -it web sh
docker stop web && docker rm web
```
