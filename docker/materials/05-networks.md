# Docker Networks

## Network Drivers

| Driver | Description | Use case |
|--------|-------------|----------|
| `bridge` | Default. Private virtual network on one host (NAT) | Single host apps |
| `host` | Container shares the host network stack (no isolation, no `-p`) | Performance, Linux only |
| `none` | No networking | Isolated batch jobs |
| `overlay` | Multi-host network (Swarm) | Clusters |
| `macvlan` | Container gets its own MAC/IP on physical LAN | Legacy apps |

---

## Default bridge vs User-defined bridge

```
           default bridge (docker0)                  user-defined bridge (app-net)
  ┌──────────┐   ┌──────────┐                 ┌──────────┐   ┌──────────┐
  │   web    │   │   db     │                 │   web    │──▶│   db     │
  │172.17.0.2│   │172.17.0.3│                 │ ping db ✔│   │          │
  └──────────┘   └──────────┘                 └──────────┘   └──────────┘
   ping db ✘ (no DNS, only IP)                  built-in DNS by container name
```

| | default `bridge` | user-defined bridge |
|---|---|---|
| DNS by container name | ✘ | ✔ |
| Isolation | all containers together | only containers you attach |
| Connect/disconnect live | ✘ | ✔ |

> Always create your own network for multi-container apps.

---

## Commands

```bash
docker network ls
docker network create app-net
docker network create --driver bridge --subnet 10.10.0.0/24 custom-net
docker network inspect app-net
docker network connect app-net web
docker network disconnect app-net web
docker network rm app-net
docker network prune
```

---

## Example: App + Database

```bash
docker network create app-net

docker run -d --name mongo --network app-net mongo:7

docker run -d --name api --network app-net -p 3000:3000 \
  -e MONGO_URL=mongodb://mongo:27017/app my-api:1.0
```

`mongo` resolves through Docker's embedded DNS server at `127.0.0.11`.

---

## Network Aliases

```bash
docker run -d --network app-net --network-alias search elasticsearch:8.13.0
# other containers can reach it as "search"
```

---

## Host network

```bash
docker run -d --network host nginx    # nginx directly on host :80 (Linux)
```

---

## Port publishing recap

- Containers on the **same network** talk on the **container port** (`db:5432`), no `-p` needed
- `-p` is only needed to reach a container **from outside** (host / browser)

---

## Debugging

```bash
docker run --rm -it --network app-net nicolaka/netshoot
# inside: dig db, curl api:3000, nslookup mongo, ping web
```
