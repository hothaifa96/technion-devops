# Demo 07 - Best Practices

```bash
# build both and compare
docker build -f Dockerfile.bad  -t bp:bad .
docker build -f Dockerfile.good -t bp:good .
docker images bp

# secret leaked into image metadata!
docker history --no-trunc bp:bad | grep API_KEY
docker inspect bp:bad -f '{{.Config.Env}}'

# who am I?
docker run --rm bp:bad  whoami     # root
docker run --rm bp:good whoami     # node

# graceful shutdown (exec form vs shell form)
docker run -d --name good bp:good && time docker stop good   # fast
docker run -d --name bad  bp:bad  && time docker stop bad    # waits 10s (sh is PID 1)

# lint
docker run --rm -i hadolint/hadolint < Dockerfile.bad

# scan
docker scout quickview bp:bad   # or: trivy image bp:bad

docker rm -f good bad
```

## Problems in Dockerfile.bad
1. `node` without tag (latest, ~1GB)
2. `ADD` instead of `COPY`
3. Copies everything before `npm install` -> no cache
4. `npm install` instead of `npm ci`, includes dev deps
5. `apt-get update` and `install` in separate layers (stale cache)
6. Installs unneeded tools (vim, git) and no apt cleanup
7. Secret in `ENV`
8. Runs as root
9. Shell-form `CMD` -> no SIGTERM forwarding
10. No `.dockerignore` / healthcheck
