#!/usr/bin/env bash
# Demo 04 - Networks. Run line by line in class.

docker network ls

# 1. default bridge: no DNS by name
docker run -d --name a1 alpine sleep 3600
docker run -d --name a2 alpine sleep 3600
docker exec a1 ping -c 1 a2                                  # bad address 'a2'
docker exec a1 ping -c 1 "$(docker inspect -f '{{.NetworkSettings.IPAddress}}' a2)"   # works by IP

# 2. user-defined bridge: DNS by name
docker network create demo-net
docker network connect demo-net a1
docker network connect demo-net a2
docker exec a1 ping -c 1 a2                                  # works!
docker exec a1 cat /etc/resolv.conf                          # nameserver 127.0.0.11

# 3. isolation between networks
docker network create other-net
docker run -d --name b1 --network other-net alpine sleep 3600
docker exec a1 ping -c 1 -W 1 b1                             # fails - different network

# 4. app + db (no -p for the db!)
docker run -d --name redis --network demo-net redis:7-alpine
docker run --rm --network demo-net redis:7-alpine redis-cli -h redis ping   # PONG

# 5. network alias (round-robin DNS)
docker run -d --network demo-net --network-alias api --name api1 traefik/whoami
docker run -d --network demo-net --network-alias api --name api2 traefik/whoami
for i in 1 2 3 4; do docker run --rm --network demo-net curlimages/curl -s api | grep Hostname; done

# 6. host & none
docker run --rm --network none alpine ip addr               # only lo
docker run --rm --network host alpine ip addr | head        # host interfaces (Linux)

# 7. debug toolbox
docker run --rm -it --network demo-net nicolaka/netshoot dig api

# cleanup
docker rm -f a1 a2 b1 redis api1 api2
docker network rm demo-net other-net
