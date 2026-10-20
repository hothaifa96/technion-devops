# Lab 07: Dockerfile Best Practices - Fix the Image

## Objective

Take a terrible Dockerfile and make it small, fast, secure and production ready.

## Prerequisites

- Read [materials/08-best-practices.md](../../materials/08-best-practices.md)

## Starter

`starter/Dockerfile` builds a Flask app. It works... but it is awful.

## Exercise

### Step 1: Measure the baseline
Record in a table:
- Image size (`docker images`)
- Build time after changing one line in `app.py`
- User inside the container (`whoami`)
- Number of CVEs (`docker scout quickview` or `trivy image`)
- Hadolint warnings (`docker run --rm -i hadolint/hadolint < Dockerfile`)
- Time for `docker stop`

### Step 2: Fix it
Rewrite the Dockerfile applying at least these practices:
1. Pinned, slim base image
2. Correct layer order for caching
3. Single `RUN` for apt with cleanup and `--no-install-recommends`
4. Remove unneeded packages
5. No secrets in the image (pass `SECRET_KEY` at runtime)
6. Non-root user
7. Exec-form `CMD` with a production server (`gunicorn`)
8. `HEALTHCHECK`
9. `.dockerignore`

### Step 3: Measure again
Fill the same table for your new image and compare.

### Step 4: Run hardened
Run your container with:
```bash
docker run -d --read-only --tmpfs /tmp --cap-drop ALL \
  --security-opt no-new-privileges --memory 128m --cpus 0.5 \
  -e SECRET_KEY=xyz -p 5000:5000 lab7:good
```
Does it still work? Fix anything that breaks.

## Challenge Exercise

1. Pin the base image by digest.
2. Make it multi-stage and/or distroless.
3. Add a GitHub Action / Jenkins stage that runs hadolint + trivy and fails on HIGH CVEs.

## Deliverables
New `Dockerfile`, `.dockerignore`, before/after table.
