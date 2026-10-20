# Lab 06: Parallel Stages & Matrix Builds

## Objective

Speed up pipelines with `parallel` and test across versions with `matrix`.

## Prerequisites

- Read [07-parallel-matrix.md](../../materials/07-parallel-matrix.md)
- Reference: [class-code/05-parallel](../../class-code/05-parallel), [class-code/06-matrix](../../class-code/06-matrix)

## Exercise

### Step 1: Sequential baseline
Write a pipeline with 4 sequential test stages: `unit` (sleep 20), `lint` (sleep 10), `security` (sleep 15), `integration` (sleep 25). Record the total duration.

### Step 2: Parallel
1. Run the 4 stages in a `parallel` block. New duration?
2. Make `lint` fail. Do the others finish? Add `failFast true` and repeat.
3. Inside `integration`, use nested sequential `stages` (start deps → test → stop deps).

### Step 3: Parallel with different agents
Run `unit` in `python:3.12-slim`, `lint` in `pipelinecomponents/flake8`, `security` in `aquasec/trivy` (Docker agents).

### Step 4: Dynamic parallel
Read a list of services from a file `services.txt` (`readFile` + `split`) and build each in parallel with a `script` block.

### Step 5: Matrix
1. Test the quotes app with Python `3.10, 3.11, 3.12` × Flask `2.3, 3.0`.
2. Exclude `3.10 + 3.0`.
3. Each cell runs in `python:${PYTHON}-slim` and installs `flask==${FLASK}.*`.
4. How many cells ran? Show the Blue Ocean / Graph view.

### Step 6: Shared workspace pitfall
Two parallel branches on the same agent both write `out.txt`. What happens? Fix with `dir()` or separate agents.

## Challenge Exercise

1. Build a multi-arch image (`linux/amd64`, `linux/arm64`) with a matrix and buildx, then create a manifest.
2. Use `parallelsAlwaysFailFast()` in options.

## Deliverables
Jenkinsfiles + duration comparison table.
