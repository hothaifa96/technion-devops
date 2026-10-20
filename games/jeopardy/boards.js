// Jeopardy boards per course topic. Select with ?board=<id> or the dropdown.
// Each category: 5 clues, 100..500 (easy -> hard).
const BOARDS = {
  docker: {
    title: "Docker",
    categories: [
      {
        category: "DOCKERFILE",
        clues: [
          { value: 100, question: "This instruction must be the first one in a Dockerfile and sets the base image.", answer: "What is FROM?" },
          { value: 200, question: "This instruction runs a command at BUILD time and creates a new layer.", answer: "What is RUN?" },
          { value: 300, question: "With ENTRYPOINT [\"ping\"] and CMD [\"localhost\"], running `docker run img 8.8.8.8` executes this.", answer: "What is `ping 8.8.8.8`? (CMD is replaced, ENTRYPOINT stays)" },
          { value: 400, question: "This instruction's variables exist only during the build, unlike ENV which persists into the container.", answer: "What is ARG?" },
          { value: 500, question: "Why should you `COPY requirements.txt` and `RUN pip install` BEFORE `COPY . .`?", answer: "What is layer caching? Code changes won't invalidate the dependency layer." },
        ],
      },
      {
        category: "DOCKER RUN",
        clues: [
          { value: 100, question: "This flag runs the container in the background.", answer: "What is -d (detached)?" },
          { value: 200, question: "In `-p 8080:80`, this number is the port on the host.", answer: "What is 8080?" },
          { value: 300, question: "This flag removes the container automatically when it exits.", answer: "What is --rm?" },
          { value: 400, question: "A container killed for exceeding its memory limit exits with this code.", answer: "What is 137 (SIGKILL / OOMKilled)?" },
          { value: 500, question: "This restart policy restarts a container always, except when it was manually stopped.", answer: "What is unless-stopped?" },
        ],
      },
      {
        category: "VOLUMES & NETWORKS",
        clues: [
          { value: 100, question: "This type of mount maps an exact host path (like your source code) into the container.", answer: "What is a bind mount?" },
          { value: 200, question: "This Docker-managed storage survives `docker rm` and is ideal for databases.", answer: "What is a named volume?" },
          { value: 300, question: "On a user-defined bridge network, containers can reach each other using this.", answer: "What is the container name (built-in DNS)?" },
          { value: 400, question: "This network driver makes a container share the host's network stack, so -p is ignored.", answer: "What is the host network?" },
          { value: 500, question: "This in-memory mount type never writes to disk.", answer: "What is tmpfs?" },
        ],
      },
      {
        category: "MULTISTAGE & BUILDX",
        clues: [
          { value: 100, question: "This keyword names a build stage, e.g. `FROM golang:1.22 ___ builder`.", answer: "What is AS?" },
          { value: 200, question: "This flag copies an artifact from an earlier stage.", answer: "What is COPY --from=<stage>?" },
          { value: 300, question: "This docker build flag builds only up to a specific stage.", answer: "What is --target?" },
          { value: 400, question: "Running an arm64 image on an amd64 EC2 instance typically fails with this error.", answer: "What is `exec format error`?" },
          { value: 500, question: "This buildx command builds for amd64 and arm64 and publishes one manifest list.", answer: "What is `docker buildx build --platform linux/amd64,linux/arm64 --push`?" },
        ],
      },
      {
        category: "BEST PRACTICES",
        clues: [
          { value: 100, question: "This file excludes files like .git and node_modules from the build context.", answer: "What is .dockerignore?" },
          { value: 200, question: "This instruction makes the container stop running as root.", answer: "What is USER?" },
          { value: 300, question: "This form of CMD makes your app PID 1 so it receives SIGTERM.", answer: "What is the exec (JSON array) form?" },
          { value: 400, question: "Why is `ENV DB_PASSWORD=secret` in a Dockerfile a bad idea?", answer: "What is: the secret is baked into the image and visible in `docker history` / inspect?" },
          { value: 500, question: "Name two tools that scan images for known CVEs.", answer: "What are Trivy and Docker Scout (also Grype, Snyk)?" },
        ],
      },
    ],
  },

  kubernetes: {
    title: "Kubernetes",
    categories: [
      {
        category: "CONTROL PLANE",
        clues: [
          { value: 100, question: "The only control plane component that talks directly to etcd.", answer: "What is the kube-apiserver?" },
          { value: 200, question: "This distributed key-value store holds the entire cluster state.", answer: "What is etcd?" },
          { value: 300, question: "This component picks a node for every Pod that has no nodeName.", answer: "What is the kube-scheduler?" },
          { value: 400, question: "This component runs the Deployment, ReplicaSet, Node and Job control loops.", answer: "What is the kube-controller-manager?" },
          { value: 500, question: "On kubeadm/minikube, control plane components run as these pods defined in /etc/kubernetes/manifests.", answer: "What are static pods?" },
        ],
      },
      {
        category: "WORKER NODE",
        clues: [
          { value: 100, question: "This agent on every node makes sure the containers of assigned Pods are running.", answer: "What is the kubelet?" },
          { value: 200, question: "This component programs iptables/IPVS rules so Service IPs reach Pods.", answer: "What is kube-proxy?" },
          { value: 300, question: "The default container runtime in most clusters today (CRI).", answer: "What is containerd?" },
          { value: 400, question: "This hidden container in every Pod holds the shared network namespace.", answer: "What is the pause container?" },
          { value: 500, question: "This command evicts all pods from a node before maintenance.", answer: "What is `kubectl drain <node> --ignore-daemonsets`?" },
        ],
      },
      {
        category: "WORKLOADS",
        clues: [
          { value: 100, question: "The smallest deployable unit in Kubernetes.", answer: "What is a Pod?" },
          { value: 200, question: "This object runs one Pod on every node - great for log agents.", answer: "What is a DaemonSet?" },
          { value: 300, question: "This workload gives pods stable names like db-0, db-1 and their own PVCs.", answer: "What is a StatefulSet?" },
          { value: 400, question: "This object runs pods to completion; its scheduled cousin uses a cron expression.", answer: "What are a Job and a CronJob?" },
          { value: 500, question: "This probe removes a Pod from Service endpoints without restarting it.", answer: "What is the readinessProbe?" },
        ],
      },
      {
        category: "NETWORKING",
        clues: [
          { value: 100, question: "The default Service type, reachable only inside the cluster.", answer: "What is ClusterIP?" },
          { value: 200, question: "This Service type opens a port in the 30000-32767 range on every node.", answer: "What is NodePort?" },
          { value: 300, question: "This object routes HTTP traffic by host and path and needs a controller to work.", answer: "What is an Ingress?" },
          { value: 400, question: "The full DNS name of service `api` in namespace `shop`.", answer: "What is api.shop.svc.cluster.local?" },
          { value: 500, question: "This object restricts pod-to-pod traffic but only works if the CNI supports it.", answer: "What is a NetworkPolicy?" },
        ],
      },
      {
        category: "CONFIG & SECURITY",
        clues: [
          { value: 100, question: "Non-sensitive key-value configuration is stored in this object.", answer: "What is a ConfigMap?" },
          { value: 200, question: "Secret values are stored encoded with this (not encrypted!) by default.", answer: "What is base64?" },
          { value: 300, question: "Role + RoleBinding grant permissions in a namespace; these two grant cluster-wide.", answer: "What are ClusterRole and ClusterRoleBinding?" },
          { value: 400, question: "The identity a Pod uses to call the Kubernetes API.", answer: "What is a ServiceAccount?" },
          { value: 500, question: "This namespace label rejects pods that don't meet the strictest Pod Security Standard.", answer: "What is pod-security.kubernetes.io/enforce: restricted?" },
        ],
      },
    ],
  },

  helm: {
    title: "Helm",
    categories: [
      {
        category: "BASICS",
        clues: [
          { value: 100, question: "Helm is often called this for Kubernetes.", answer: "What is the package manager?" },
          { value: 200, question: "A Helm package containing templates and default values.", answer: "What is a chart?" },
          { value: 300, question: "An installed instance of a chart in the cluster.", answer: "What is a release?" },
          { value: 400, question: "Helm 3 stores release history as these objects in the release namespace.", answer: "What are Secrets (sh.helm.release.v1.*)?" },
          { value: 500, question: "This idempotent command installs a release if missing or upgrades it if present.", answer: "What is `helm upgrade --install`?" },
        ],
      },
      {
        category: "CHART STRUCTURE",
        clues: [
          { value: 100, question: "This file holds the chart name, version and appVersion.", answer: "What is Chart.yaml?" },
          { value: 200, question: "This file contains the default configuration of the chart.", answer: "What is values.yaml?" },
          { value: 300, question: "Template files starting with this character produce no output, e.g. _helpers.tpl.", answer: "What is an underscore (_)?" },
          { value: 400, question: "Its content is printed to the user after install.", answer: "What is templates/NOTES.txt?" },
          { value: 500, question: "Difference between `version` and `appVersion` in Chart.yaml.", answer: "What is: version = chart version (SemVer), appVersion = version of the application inside?" },
        ],
      },
      {
        category: "TEMPLATING",
        clues: [
          { value: 100, question: "The built-in object that gives access to values: {{ .____.replicaCount }}.", answer: "What is .Values?" },
          { value: 200, question: "This function returns a fallback when a value is empty.", answer: "What is default?" },
          { value: 300, question: "Inside a range loop, use this symbol to reach the root context.", answer: "What is $ (e.g. $.Release.Name)?" },
          { value: 400, question: "Why prefer `include` over `template` for named templates?", answer: "What is: include returns a string that can be piped (e.g. | nindent 4)?" },
          { value: 500, question: "This annotation trick rolls pods automatically when a ConfigMap changes.", answer: "What is checksum/config: {{ include ... | sha256sum }}?" },
        ],
      },
      {
        category: "LIFECYCLE",
        clues: [
          { value: 100, question: "Command that lists all revisions of a release.", answer: "What is `helm history`?" },
          { value: 200, question: "Command to go back to revision 2.", answer: "What is `helm rollback <release> 2`?" },
          { value: 300, question: "This flag rolls back automatically if the upgrade fails.", answer: "What is --atomic?" },
          { value: 400, question: "Command that renders templates locally without a cluster.", answer: "What is `helm template`?" },
          { value: 500, question: "Order of precedence (lowest -> highest) between values.yaml, -f file and --set.", answer: "What is values.yaml < -f < --set?" },
        ],
      },
      {
        category: "ADVANCED",
        clues: [
          { value: 100, question: "This command downloads chart dependencies into charts/.", answer: "What is `helm dependency update`?" },
          { value: 200, question: "Values under this key are visible to the parent and all subcharts.", answer: "What is global?" },
          { value: 300, question: "This hook runs a Job before the release resources are upgraded, e.g. DB migration.", answer: "What is pre-upgrade?" },
          { value: 400, question: "Command that runs pods annotated with helm.sh/hook: test.", answer: "What is `helm test`?" },
          { value: 500, question: "Modern way to publish charts to Docker Hub/ECR/GHCR.", answer: "What is an OCI registry (`helm push chart.tgz oci://...`)?" },
        ],
      },
    ],
  },

  jenkins: {
    title: "Jenkins CI/CD",
    categories: [
      {
        category: "ARCHITECTURE",
        clues: [
          { value: 100, question: "The file that defines a pipeline as code.", answer: "What is a Jenkinsfile?" },
          { value: 200, question: "The main Jenkins server that schedules builds (formerly 'master').", answer: "What is the controller?" },
          { value: 300, question: "A slot on an agent that runs one build at a time.", answer: "What is an executor?" },
          { value: 400, question: "The two pipeline syntaxes, one starting with `pipeline {}` and one with `node {}`.", answer: "What are Declarative and Scripted?" },
          { value: 500, question: "This job type automatically creates a pipeline for every branch and PR.", answer: "What is a Multibranch Pipeline?" },
        ],
      },
      {
        category: "SYNTAX",
        clues: [
          { value: 100, question: "Directive that tells Jenkins where to run: any, none, label, docker.", answer: "What is agent?" },
          { value: 200, question: "Block where you write real Groovy logic inside a declarative pipeline.", answer: "What is script { }?" },
          { value: 300, question: "How to capture the output of a shell command into a variable.", answer: "What is sh(script: '...', returnStdout: true).trim()?" },
          { value: 400, question: "Directive that defines build inputs like string, choice and booleanParam.", answer: "What is parameters?" },
          { value: 500, question: "Directive used to start builds on a schedule, e.g. cron('H 2 * * *').", answer: "What is triggers?" },
        ],
      },
      {
        category: "ENV & CREDENTIALS",
        clues: [
          { value: 100, question: "Built-in variable with the current build's number.", answer: "What is BUILD_NUMBER?" },
          { value: 200, question: "`DOCKER = credentials('hub')` creates these two extra variables.", answer: "What are DOCKER_USR and DOCKER_PSW?" },
          { value: 300, question: "Step that exposes secrets only inside a block.", answer: "What is withCredentials?" },
          { value: 400, question: "Why use single quotes in `sh 'docker login -p $PASS'`?", answer: "What is: the shell expands the secret, not Groovy interpolation (avoids leaking)?" },
          { value: 500, question: "Variable in multibranch builds holding the PR number.", answer: "What is CHANGE_ID?" },
        ],
      },
      {
        category: "FLOW CONTROL",
        clues: [
          { value: 100, question: "Directive that runs a stage only if a condition is true.", answer: "What is when?" },
          { value: 200, question: "Directive that pauses the pipeline for human approval.", answer: "What is input?" },
          { value: 300, question: "Block to run several stages at the same time.", answer: "What is parallel?" },
          { value: 400, question: "Setting that aborts other parallel branches as soon as one fails.", answer: "What is failFast true?" },
          { value: 500, question: "Directive that runs the same stages for every combination of axes.", answer: "What is matrix?" },
        ],
      },
      {
        category: "POST & RELIABILITY",
        clues: [
          { value: 100, question: "Post condition that runs regardless of the result.", answer: "What is always?" },
          { value: 200, question: "Build color/result when JUnit tests fail.", answer: "What is UNSTABLE (yellow)?" },
          { value: 300, question: "Step that re-runs a block up to N times.", answer: "What is retry(N)?" },
          { value: 400, question: "Post condition that runs when the previous build failed and this one succeeded.", answer: "What is fixed?" },
          { value: 500, question: "Step that catches a failure, marks the stage red but keeps the build green.", answer: "What is catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE')?" },
        ],
      },
    ],
  },

  observability: {
    title: "Prometheus & Grafana",
    categories: [
      {
        category: "PROMETHEUS ARCH",
        clues: [
          { value: 100, question: "Prometheus collects metrics with this model - it scrapes targets.", answer: "What is pull?" },
          { value: 200, question: "Default port of the Prometheus UI.", answer: "What is 9090?" },
          { value: 300, question: "Metric that is 1 when a scrape succeeded and 0 when it failed.", answer: "What is up?" },
          { value: 400, question: "Component that dedupes, groups and routes alerts to Slack/email.", answer: "What is Alertmanager?" },
          { value: 500, question: "Component used by short-lived batch jobs to push metrics.", answer: "What is the Pushgateway?" },
        ],
      },
      {
        category: "METRIC TYPES",
        clues: [
          { value: 100, question: "A metric that only goes up, like requests served.", answer: "What is a Counter?" },
          { value: 200, question: "A metric that goes up and down, like memory usage.", answer: "What is a Gauge?" },
          { value: 300, question: "Type that stores observations in `le` buckets.", answer: "What is a Histogram?" },
          { value: 400, question: "Type that computes quantiles in the client and can't be aggregated across instances.", answer: "What is a Summary?" },
          { value: 500, question: "Why is `user_id` a terrible label?", answer: "What is high cardinality - a new time series per user?" },
        ],
      },
      {
        category: "PROMQL",
        clues: [
          { value: 100, question: "Function that gives the per-second average rate of a counter.", answer: "What is rate()?" },
          { value: 200, question: "Aggregate requests per endpoint: sum ___ (endpoint) (rate(x[5m])).", answer: "What is by?" },
          { value: 300, question: "Function to compute p95 latency from buckets.", answer: "What is histogram_quantile(0.95, ...)?" },
          { value: 400, question: "Function that forecasts if a disk will be full in 4 hours.", answer: "What is predict_linear()?" },
          { value: 500, question: "Why `sum(rate(x[5m]))` and not `rate(sum(x)[5m])`?", answer: "What is: rate must handle per-series counter resets before aggregation?" },
        ],
      },
      {
        category: "EXPORTERS & PYTHON",
        clues: [
          { value: 100, question: "Exporter for Linux host metrics on port 9100.", answer: "What is node_exporter?" },
          { value: 200, question: "Exporter that probes HTTP/TCP/ICMP endpoints from the outside.", answer: "What is the blackbox exporter?" },
          { value: 300, question: "Python function that serves /metrics on a port in a background thread.", answer: "What is start_http_server()?" },
          { value: 400, question: "Method a custom collector implements; called on every scrape.", answer: "What is collect()?" },
          { value: 500, question: "Kubernetes CRD from the Prometheus Operator that scrapes a Service by label selector.", answer: "What is a ServiceMonitor?" },
        ],
      },
      {
        category: "GRAFANA",
        clues: [
          { value: 100, question: "Default Grafana port.", answer: "What is 3000?" },
          { value: 200, question: "Grafana connects to Prometheus through this configuration object.", answer: "What is a data source?" },
          { value: 300, question: "Query-based dropdowns like $job and $instance on a dashboard.", answer: "What are template variables?" },
          { value: 400, question: "Grafana variable that picks a safe range for rate() automatically.", answer: "What is $__rate_interval?" },
          { value: 500, question: "Loading data sources and dashboards from YAML/JSON files at startup.", answer: "What is provisioning?" },
        ],
      },
    ],
  },
};
