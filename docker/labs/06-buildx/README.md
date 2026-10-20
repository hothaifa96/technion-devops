# Lab 06: Buildx & Multi-platform Images

## Objective

Build and publish images for `linux/amd64` and `linux/arm64` with one command, and use BuildKit features (cache mounts, secrets).

## Prerequisites

- Docker Hub account
- Read [materials/07-buildx.md](../../materials/07-buildx.md)

## Exercise

### Step 1: Builders
1. Run `docker buildx ls`. Which platforms does the default builder support?
2. Create a new builder `lab-builder` with the `docker-container` driver and bootstrap it.

### Step 2: The exec format error
1. Build the app from `class-code/06-buildx` for the **other** architecture than your laptop with `--load`.
2. Try to run it without `--platform`. What warning/error do you get?

### Step 3: Multi-platform push
1. Build and push `<user>/multiarch-lab:1.0` for `linux/amd64,linux/arm64`.
2. Use `docker buildx imagetools inspect` and paste the output - how many manifests?
3. Pull it on an EC2 instance (amd64) and on your laptop. Run `uname -m` inside both.

### Step 4: Cache mount
1. Add `RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt` to a Python Dockerfile.
2. Add a new dependency to `requirements.txt` and rebuild. Compare build time with/without the cache mount.

### Step 5: Build secret
1. Create a file `token.txt` with a fake token.
2. In the Dockerfile, read it with `RUN --mount=type=secret,id=token cat /run/secrets/token > /dev/null && echo "got token"`.
3. Build with `--secret id=token,src=token.txt`.
4. Prove the token is **not** in the image (`docker history`, `docker run ... ls /run/secrets`).

## Challenge Exercise

1. Use `FROM --platform=$BUILDPLATFORM` + `TARGETARCH` to cross-compile a Go binary (no QEMU emulation). Compare build time vs emulation.
2. Write a `docker-bake.hcl` that builds two images (api + web) and run `docker buildx bake`.
3. Export a registry cache with `--cache-to type=registry` and show the second build is faster.

## Deliverables
Dockerfile, bake file, output of `imagetools inspect`.
