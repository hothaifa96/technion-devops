# Lab 05: Dependencies & Umbrella Chart

## Objective

Deploy a full microservices system as one Helm release using subcharts and public dependencies.

## Prerequisites

- Read [materials/05-dependencies.md](../../materials/05-dependencies.md)
- Reference: [class-code/04-umbrella](../../class-code/04-umbrella)
- Reuse the chat app from [k8s/labs/chat-microservices](../../../k8s/labs/chat-microservices) (frontend, chatter-a, chatter-b)

## Exercise

### Step 1: Subcharts
1. Create an umbrella chart `chat`.
2. Create subcharts `frontend` and `chatter` under `chat/charts/`.
3. `chatter` must be installed **twice** (chatter-a, chatter-b) - use `alias` in `Chart.yaml` dependencies.

### Step 2: Public dependency
Add `bitnami/redis` (OCI `oci://registry-1.docker.io/bitnamicharts`) as a dependency with `condition: redis.enabled`, standalone architecture, no persistence.

### Step 3: Values
1. Configure every subchart from the umbrella `values.yaml`.
2. Use `global.domain` for the ingress host in all subcharts.
3. Run `helm dependency update` - what is `Chart.lock` for? Commit it?

### Step 4: Deploy
1. `helm upgrade --install chat ./chat -n chat --create-namespace`
2. Test the app through the ingress.
3. Disable redis with `--set redis.enabled=false` - what is removed?

### Step 5: Visibility
1. Can the `frontend` subchart read `.Values.chatter-a.replicaCount`? Prove it.
2. Can the umbrella NOTES.txt read subchart values? Prove it.

## Challenge Exercise

1. Extract the common labels/deployment template into a **library chart** `common` and use it from both subcharts.
2. Use `import-values` to expose a value from a subchart to the parent.

## Deliverables
The `chat/` umbrella chart.
