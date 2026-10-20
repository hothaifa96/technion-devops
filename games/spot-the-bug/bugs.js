// Spot-the-bug challenges. `bug` = 1-based line numbers that contain the bug (any of them counts).
const BUGS = [
  // ---------------- Docker ----------------
  {
    topic: "docker",
    lang: "Dockerfile",
    title: "The cache never hits",
    code: `FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "app.py"]`,
    bug: [3, 4],
    explain:
      "`COPY . .` before `pip install` invalidates the dependency layer on every code change. Copy requirements.txt first, install, then copy the code.",
  },
  {
    topic: "docker",
    lang: "Dockerfile",
    title: "docker stop takes 10 seconds",
    code: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
CMD node server.js`,
    bug: [7],
    explain:
      'Shell-form CMD runs `/bin/sh -c`, so node is not PID 1 and never receives SIGTERM. Use `CMD ["node", "server.js"]`.',
  },
  {
    topic: "docker",
    lang: "Dockerfile",
    title: "Leaky image",
    code: `FROM python:3.12-slim
ENV AWS_SECRET_ACCESS_KEY=AKIA1234567890SECRET
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]`,
    bug: [2],
    explain:
      "Secrets in ENV are stored in the image config and visible with `docker inspect` / `docker history`. Pass them at runtime or use build secrets.",
  },
  {
    topic: "docker",
    lang: "bash",
    title: "Containers can't find each other",
    code: `docker run -d --name db -e POSTGRES_PASSWORD=pw postgres:16
docker run -d --name api -p 3000:3000 \\
  -e DB_HOST=db my-api:1.0
# api logs: getaddrinfo ENOTFOUND db`,
    bug: [1, 2],
    explain:
      "Both containers are on the default bridge network which has no DNS. Create a network (`docker network create app`) and run both with `--network app`.",
  },
  {
    topic: "docker",
    lang: "Dockerfile",
    title: "Multi-stage that isn't small",
    code: `FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /out/app .

FROM golang:1.22
COPY --from=build /out/app /app
ENTRYPOINT ["/app"]`,
    bug: [6],
    explain:
      "The final stage uses the full Go toolchain image again (~800MB). Use `gcr.io/distroless/static`, `alpine` or `scratch` for the runtime stage.",
  },

  // ---------------- Kubernetes ----------------
  {
    topic: "kubernetes",
    lang: "yaml",
    title: "Service with no endpoints",
    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: web
          image: nginx:1.27
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector: { app: frontend }
  ports:
    - port: 80`,
    bug: [22],
    explain:
      "The Service selector `app: frontend` doesn't match the Pod label `app: web`, so `kubectl get endpoints web` is empty.",
  },
  {
    topic: "kubernetes",
    lang: "yaml",
    title: "Deployment rejected by the API",
    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: api
          image: traefik/whoami`,
    bug: [13],
    explain:
      "`spec.selector` must match the template labels. `app: api` != `app: backend` → error: selector does not match template labels.",
  },
  {
    topic: "kubernetes",
    lang: "yaml",
    title: "The Job never finishes",
    code: `apiVersion: batch/v1
kind: Job
metadata:
  name: migrate
spec:
  template:
    spec:
      restartPolicy: Always
      containers:
        - name: migrate
          image: myapp:1.0
          command: ["python", "manage.py", "migrate"]`,
    bug: [8],
    explain:
      "Jobs require `restartPolicy: Never` or `OnFailure`. `Always` is rejected by the API.",
  },
  {
    topic: "kubernetes",
    lang: "yaml",
    title: "Pods keep getting OOMKilled",
    code: `containers:
  - name: java-api
    image: myorg/java-api:2.1
    env:
      - name: JAVA_OPTS
        value: "-Xmx1024m"
    resources:
      requests:
        memory: 128Mi
        cpu: 250m
      limits:
        memory: 256Mi
        cpu: 500m`,
    bug: [6, 12],
    explain:
      "The JVM heap is allowed to grow to 1GiB but the container memory limit is 256Mi → kernel OOM kill (exit 137). Align heap and limit.",
  },
  {
    topic: "kubernetes",
    lang: "yaml",
    title: "Can't read pods with this SA",
    code: `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: dev
rules:
  - apiGroups: ["apps"]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]`,
    bug: [7],
    explain:
      'Pods are in the core API group, written as `apiGroups: [""]`. `apps` is for Deployments/ReplicaSets/StatefulSets.',
  },
  {
    topic: "kubernetes",
    lang: "yaml",
    title: "Traffic goes to pods that aren't ready",
    code: `containers:
  - name: api
    image: myorg/api:3.0
    ports:
      - containerPort: 8080
    livenessProbe:
      httpGet:
        path: /healthz
        port: 80`,
    bug: [9],
    explain:
      "The probe targets port 80 but the app listens on 8080 → liveness always fails and the container restarts in a loop. (Also add a readinessProbe!)",
  },

  // ---------------- Helm ----------------
  {
    topic: "helm",
    lang: "yaml",
    title: "Broken indentation after render",
    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "app.fullname" . }}
  labels:
{{ include "app.labels" . }}
spec:
  replicas: {{ .Values.replicaCount }}`,
    bug: [6],
    explain:
      'The labels are rendered at column 0. Use `{{- include "app.labels" . | nindent 4 }}`.',
  },
  {
    topic: "helm",
    lang: "yaml",
    title: "nil pointer inside range",
    code: `env:
{{- range $key, $val := .Values.env }}
  - name: {{ $key }}
    value: {{ $val | quote }}
  - name: RELEASE
    value: {{ .Release.Name }}
{{- end }}`,
    bug: [6],
    explain:
      "Inside `range`, `.` is the current item, so `.Release` is nil. Use `$.Release.Name`.",
  },
  {
    topic: "helm",
    lang: "yaml",
    title: "Number where a string is required",
    code: `metadata:
  annotations:
    prometheus.io/scrape: {{ .Values.metrics.enabled }}
    prometheus.io/port: {{ .Values.metrics.port }}`,
    bug: [3, 4],
    explain:
      "Annotation values must be strings; `true` / `9100` render as bool/int and the API rejects them. Use `| quote`.",
  },
  {
    topic: "helm",
    lang: "yaml",
    title: "Hook blocks the second upgrade",
    code: `apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}-migrate
  annotations:
    "helm.sh/hook": pre-upgrade
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: myapp:{{ .Values.image.tag }}`,
    bug: [6],
    explain:
      "Without `helm.sh/hook-delete-policy: before-hook-creation` the old Job still exists and the next upgrade fails with 'already exists'.",
  },

  // ---------------- Jenkins ----------------
  {
    topic: "jenkins",
    lang: "groovy",
    title: "Secret leaking warning",
    code: `pipeline {
  agent any
  environment { HUB = credentials('dockerhub') }
  stages {
    stage('Push') {
      steps {
        sh "docker login -u \${HUB_USR} -p \${HUB_PSW}"
        sh 'docker push myuser/app:1.0'
      }
    }
  }
}`,
    bug: [7],
    explain:
      "Double quotes make Groovy interpolate the secret into the command string. Use single quotes and --password-stdin: `sh 'echo $HUB_PSW | docker login -u $HUB_USR --password-stdin'`.",
  },
  {
    topic: "jenkins",
    lang: "groovy",
    title: "Invalid stage",
    code: `pipeline {
  agent any
  stages {
    stage('Tests') {
      steps {
        sh 'make build'
      }
      parallel {
        stage('Unit') { steps { sh 'make unit' } }
        stage('Lint') { steps { sh 'make lint' } }
      }
    }
  }
}`,
    bug: [5, 8],
    explain:
      "A stage can have only ONE of steps / stages / parallel / matrix. Move `make build` to its own stage.",
  },
  {
    topic: "jenkins",
    lang: "groovy",
    title: "Executor held for hours",
    code: `pipeline {
  agent any
  stages {
    stage('Build') { steps { sh 'make' } }
    stage('Approve') {
      steps {
        input message: 'Deploy to prod?'
      }
    }
    stage('Deploy') { steps { sh './deploy.sh' } }
  }
}`,
    bug: [2, 7],
    explain:
      "With a global `agent any`, the executor is busy while waiting for a human. Use `agent none` + per-stage agents, the `input` directive on an agent-less stage, and a timeout.",
  },
  {
    topic: "jenkins",
    lang: "groovy",
    title: "Cleanup never happens on failure",
    code: `pipeline {
  agent any
  stages {
    stage('Test') {
      steps {
        sh 'docker run -d --name app-test myapp:1.0'
        sh 'curl -f http://app-test:5000/health'
        sh 'docker rm -f app-test'
      }
    }
  }
}`,
    bug: [8],
    explain:
      "If curl fails, the next step never runs and the container leaks (next build fails on name conflict). Move removal to `post { always { ... } }`.",
  },

  // ---------------- Observability ----------------
  {
    topic: "observability",
    lang: "promql",
    title: "Requests per second?",
    code: `sum(http_requests_total{job="shop"})`,
    bug: [1],
    explain:
      'A counter\'s raw value is cumulative since process start. Use `sum(rate(http_requests_total{job="shop"}[5m]))`.',
  },
  {
    topic: "observability",
    lang: "promql",
    title: "Wrong p95",
    code: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
# graph shows one line per pod and per endpoint and per ... ?`,
    bug: [1],
    explain:
      "Aggregate the buckets first while keeping `le`: `histogram_quantile(0.95, sum by (le) (rate(..._bucket[5m])))`.",
  },
  {
    topic: "observability",
    lang: "python",
    title: "Prometheus memory explodes",
    code: `from prometheus_client import Counter
REQS = Counter("app_requests_total", "Requests", ["path", "user_id"])

@app.after_request
def record(resp):
    REQS.labels(path=request.path, user_id=session["user_id"]).inc()
    return resp`,
    bug: [2, 6],
    explain:
      "`user_id` and raw `request.path` (/orders/123...) are unbounded labels → millions of series. Use the route template (`request.url_rule`) and drop user_id.",
  },
  {
    topic: "observability",
    lang: "yaml",
    title: "Target never appears",
    code: `apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: shop
  namespace: dev
spec:
  selector:
    matchLabels: { app: shop }
  endpoints:
    - port: "5000"
      path: /metrics`,
    bug: [3, 10],
    explain:
      "Two classics: missing `labels: { release: <kps-release> }` required by the Prometheus serviceMonitorSelector, and `port` must be the NAME of the Service port (e.g. http), not the number.",
  },
  {
    topic: "observability",
    lang: "yaml",
    title: "Alert fires on every blip",
    code: `groups:
  - name: shop
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[1m]) > 0
        labels:
          severity: critical`,
    bug: [5],
    explain:
      "Any single 500 pages someone at night. Alert on a RATIO with a threshold and a `for:` duration, e.g. errors/total > 0.05 for 5m.",
  },
];
