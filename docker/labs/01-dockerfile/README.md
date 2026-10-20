# Lab 01: Writing a Dockerfile

## Objective

Containerize a small Python API and understand layers, caching, `ARG`/`ENV` and `CMD`/`ENTRYPOINT`.

## Prerequisites

- Docker installed (`docker version`)
- Read [materials/02-dockerfile.md](../../materials/02-dockerfile.md)

## Starter files

The folder `starter/` contains `app.py` and `requirements.txt` - a "quote of the day" API.

## Exercise

### Step 1: Write the Dockerfile
Create `starter/Dockerfile` that:
1. Uses `python:3.12-slim` as base
2. Sets the working directory to `/app`
3. Installs the dependencies **before** copying the source code
4. Exposes port `8000`
5. Starts the app with exec-form `CMD`

### Step 2: Build and run
- Build the image with the tag `quotes:1.0`
- Run it in the background, name it `quotes`, publish it on host port `8000`
- `curl localhost:8000/quote` should return JSON

### Step 3: Layers
- Run `docker history quotes:1.0` - which layer is the largest? why?
- Change only `app.py` and rebuild. Which steps were `CACHED`?
- Now move `COPY . .` above `pip install` and rebuild after a code change. What happened? Revert.

### Step 4: ARG & ENV
- Add `ARG VERSION=1.0` and expose it to the app as `ENV APP_VERSION`
- Build `quotes:2.0` with `--build-arg VERSION=2.0` and check `curl localhost:8000/version`
- Run a container overriding `APP_VERSION` at runtime with `-e`. Which wins?

### Step 5: HEALTHCHECK
Add a `HEALTHCHECK` that calls `/health` every 10 seconds. Verify with `docker ps` that the status becomes `healthy`.

### Step 6: .dockerignore
Create a `.dockerignore` that excludes `__pycache__`, `.git`, `.env` and `*.md`.

## Challenge Exercise

1. Write `Dockerfile.cli` for a tool image: `ENTRYPOINT ["curl", "-s"]` with `CMD ["https://api.github.com"]`. Run it with and without an argument.
2. Push `quotes:2.0` to your Docker Hub account as `<user>/quotes:2.0`.
3. Explain in 2 sentences the difference between `EXPOSE` and `-p`.

## Deliverables
- `Dockerfile`, `.dockerignore`, `Dockerfile.cli`
- A short `answers.md` with the answers to the questions above
