# Lab 03: Templating Deep Dive

## Objective

Master flow control, functions, helpers and files in Helm templates.

## Prerequisites

- Read [materials/03-templates-values.md](../../materials/03-templates-values.md)
- Reference: [class-code/03-advanced-templating](../../class-code/03-advanced-templating)

## Exercise

Extend your `quotes` chart from lab 02.

### Step 1: Conditionals
1. Add an `ingress.yaml` rendered only if `ingress.enabled`.
2. Add an `hpa.yaml` rendered only if `autoscaling.enabled`; when enabled, the Deployment must **not** set `replicas`.
3. If `environment` is `prod`, add the label `tier: critical`.

### Step 2: Loops
1. `ingress.hosts` is a list of `{host, paths[]}` - render all hosts and paths.
2. `env` is a map - render it as container env vars.
3. `extraPorts` is a list of `{name, port}` - render them in the Service.

### Step 3: Functions
1. `image.tag` must default to `.Chart.AppVersion`.
2. Make `service.port` **required** with a clear error message.
3. Render a Secret from `secrets` map using `b64enc`.
4. Force all label values to lowercase and max 63 chars.

### Step 4: Helpers
Create in `_helpers.tpl`:
- `quotes.fullname`
- `quotes.labels` and `quotes.selectorLabels`
- `quotes.image` that returns `repo:tag`
Use them everywhere.

### Step 5: Files
1. Put `config/app.ini` in the chart and mount it via a ConfigMap using `.Files.Get`.
2. Make `app.ini` contain `{{ .Values.environment }}` and render it with `tpl`.

### Step 6: Auto roll
Add a `checksum/config` annotation and prove that changing a config value rolls the pods.

### Step 7: Whitespace
Render `helm template` and make sure there are **no** empty lines or broken indentation. Fix with `{{-`, `-}}` and `nindent`.

## Challenge Exercise

1. Use `lookup` to reuse an existing Secret password on upgrade instead of generating a new random one.
2. Use `.Capabilities.APIVersions.Has` to render `autoscaling/v2` or `autoscaling/v2beta2`.
3. Pipe `helm template` into `kubeconform -strict` and fix all errors.

## Deliverables
Updated chart + `helm template` output for dev and prod values.
