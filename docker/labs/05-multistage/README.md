# Lab 05: Multi-stage Builds

## Objective

Shrink images by separating build and runtime stages.

## Prerequisites

- Read [materials/06-multistage.md](../../materials/06-multistage.md)

## Part A - React frontend

1. Create a React app: `npx create-vite@latest frontend -- --template react` (or reuse `docker/scrape-cube/frontend`).
2. Write a **single-stage** `Dockerfile.single` based on `node:20` that runs `npm run dev` / `npm start`. Build it as `front:single`.
3. Write a **multi-stage** `Dockerfile`:
   - stage `build`: `node:20-alpine`, `npm ci`, `npm run build`
   - stage `runtime`: `nginx:1.27-alpine`, copy the build output to `/usr/share/nginx/html`
4. Build `front:multi` and compare sizes with `docker images front`.
5. Run it on port `8080` and verify it works.

## Part B - Java / Go / Python (pick one)

| Language | Build stage | Runtime stage |
|----------|-------------|---------------|
| Java | `maven:3.9-eclipse-temurin-21` + `mvn package` | `eclipse-temurin:21-jre-alpine` |
| Go | `golang:1.22-alpine` + `go build` | `gcr.io/distroless/static` or `scratch` |
| Python | `python:3.12` + `pip wheel` | `python:3.12-slim` |

Write the multi-stage Dockerfile and document the size before/after.

## Part C - Test stage

1. Add a `test` stage that runs your unit tests / linter (e.g. `npm test`, `go vet`, `pytest`).
2. Build only that stage with `--target test`. Make a test fail - does the build fail?
3. Build the final image - is the test stage executed? (hint: BuildKit skips unused stages)

## Challenge Exercise

1. Use `scratch` as the final image for the Go app. What do you need to add to make HTTPS calls work? (hint: CA certificates)
2. Use `COPY --from=nginx:alpine` to grab a file from an external image.
3. Add a non-root user in the final stage.

## Deliverables
Dockerfiles + table of image sizes.
