# Demo 05 - Multi-stage

```bash
docker build -f Dockerfile.single -t go-app:single .
docker build -t go-app:multi .
docker images go-app            # compare: ~850MB vs ~8MB

docker run -d --rm -p 8080:8080 --name go go-app:multi
curl localhost:8080

# no shell in distroless:
docker exec -it go sh           # fails - that's the point

# build only a stage
docker build --target test -t go-app:test .

docker rm -f go
```
