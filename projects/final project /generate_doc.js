const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TableOfContents
} = require("docx");

// ─── Color Palette ───
const COLORS = {
  primary: "1B4F72",
  secondary: "2E86C1",
  accent: "2ECC71",
  dark: "2C3E50",
  lightBg: "EBF5FB",
  lightGray: "F8F9FA",
  mediumGray: "BDC3C7",
  border: "D5DBDB",
  white: "FFFFFF",
  black: "000000",
  tagBg: "D4E6F1",
  warningBg: "FEF9E7",
  techBg: "E8F8F5",
};

// ─── Shared Constants ───
const PAGE_WIDTH = 12240;
const PAGE_HEIGHT = 15840;
const MARGIN = 1080; // 0.75 inches
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const border = { style: BorderStyle.SINGLE, size: 1, color: COLORS.border };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0 };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

// ─── Helper Functions ───
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, font: "Arial", color: COLORS.primary })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: COLORS.secondary })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: COLORS.dark })],
  });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: COLORS.black, ...opts })],
  });
}

function bulletItem(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 21, font: "Arial" })],
  });
}

function numberedItem(text, level = 0, ref = "numbers") {
  return new Paragraph({
    numbering: { reference: ref, level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 21, font: "Arial" })],
  });
}

function codeEndpoint(method, path, desc) {
  return new Paragraph({
    spacing: { after: 40 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: method + " ", bold: true, size: 20, font: "Courier New", color: COLORS.secondary }),
      new TextRun({ text: path + "  ", size: 20, font: "Courier New", color: COLORS.dark }),
      new TextRun({ text: desc, size: 20, font: "Arial", italics: true, color: "666666" }),
    ],
  });
}

function techStackTable(rows) {
  // rows = [[layer, tool], ...]
  const colWidths = [Math.floor(CONTENT_WIDTH * 0.35), CONTENT_WIDTH - Math.floor(CONTENT_WIDTH * 0.35)];
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders,
        width: { size: colWidths[0], type: WidthType.DXA },
        shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: "Layer / Component", bold: true, size: 20, font: "Arial", color: COLORS.white })] })],
      }),
      new TableCell({
        borders,
        width: { size: colWidths[1], type: WidthType.DXA },
        shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: "Technology / Tool", bold: true, size: 20, font: "Arial", color: COLORS.white })] })],
      }),
    ],
  });

  const dataRows = rows.map((r, i) =>
    new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: colWidths[0], type: WidthType.DXA },
          shading: { fill: i % 2 === 0 ? COLORS.lightBg : COLORS.white, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: r[0], bold: true, size: 20, font: "Arial", color: COLORS.dark })] })],
        }),
        new TableCell({
          borders,
          width: { size: colWidths[1], type: WidthType.DXA },
          shading: { fill: i % 2 === 0 ? COLORS.lightBg : COLORS.white, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: r[1], size: 20, font: "Arial" })] })],
        }),
      ],
    })
  );

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.mediumGray } },
    children: [],
  });
}

function spacer(pts = 120) {
  return new Paragraph({ spacing: { after: pts }, children: [] });
}

// ─── Standard DevOps Stack (shared across all projects) ───
const STANDARD_DEVOPS_STACK = [
  ["Backend Framework", "Python Flask (with Flask-RESTful, Flask-Migrate, Flask-SQLAlchemy)"],
  ["Frontend (Optional)", "React.js (with Chart.js / Recharts for visualization)"],
  ["Database", "PostgreSQL 15+ (via SQLAlchemy ORM)"],
  ["Containerization", "Docker (multi-stage builds, Docker Compose for local dev)"],
  ["Container Orchestration", "Kubernetes (Minikube for local, EKS/GKE for cloud)"],
  ["Infrastructure as Code", "Terraform (modules, remote state backend, workspaces)"],
  ["CI/CD", "Jenkins (Declarative Pipeline) + GitHub Actions"],
  ["Container Registry", "Docker Hub / Amazon ECR / GitHub Container Registry"],
  ["Monitoring", "Prometheus (with custom exporters + Alertmanager)"],
  ["Dashboards", "Grafana (pre-configured dashboards + alerting rules)"],
  ["Secrets Management", "Kubernetes Secrets + HashiCorp Vault (optional)"],
  ["Code Quality", "SonarQube (SAST) + Flake8/ESLint (linting)"],
  ["Security Scanning", "Trivy (container scanning) + GitLeaks (secret detection)"],
  ["Version Control", "Git (GitHub / GitLab) with branch protection"],
  ["Package Management", "Helm Charts for Kubernetes deployments"],
  ["Ingress / Load Balancing", "NGINX Ingress Controller"],
  ["Logging", "ELK Stack (Elasticsearch, Logstash, Kibana) or Loki + Promtail"],
];

function standardDevOpsSection() {
  return [
    heading2("DevOps Stack & Requirements"),
    bodyText("All projects share the following standardized DevOps stack:"),
    spacer(60),
    techStackTable(STANDARD_DEVOPS_STACK),
    spacer(80),
    heading3("1. Containerization"),
    bulletItem("Write separate Dockerfiles for Flask backend and React frontend"),
    bulletItem("Use multi-stage builds to optimize image sizes"),
    bulletItem("Use docker-compose for local development to link Flask, React, and PostgreSQL"),
    bulletItem("Pin base images to specific versions (e.g., python:3.11-slim, node:20-alpine)"),
    heading3("2. Infrastructure as Code (Terraform)"),
    bulletItem("Write Terraform modules for provisioning Kubernetes cluster (EKS/GKE/Minikube)"),
    bulletItem("Use remote state backend (S3 + DynamoDB or Terraform Cloud)"),
    bulletItem("Implement workspaces for dev/staging/prod environments"),
    bulletItem("Use variables, outputs, and data sources for reusable infrastructure"),
    heading3("3. Kubernetes Deployment"),
    bulletItem("Create ConfigMaps for application-specific configurations"),
    bulletItem("Use Secrets for database credentials and API keys"),
    bulletItem("Define Deployments for Flask, React, and PostgreSQL"),
    bulletItem("Create Services (ClusterIP, NodePort) for backend/frontend communication"),
    bulletItem("Set up NGINX Ingress Controller for external access"),
    bulletItem("Implement liveness and readiness probes on all pods"),
    bulletItem("Use Helm Charts to package and version Kubernetes manifests"),
    bulletItem("Define resource requests and limits for all containers"),
    heading3("4. CI/CD Pipeline (Jenkins + GitHub Actions)"),
    numberedItem("Lint Flask (Flake8) and React (ESLint) code"),
    numberedItem("Run unit tests for backend logic (pytest) and frontend (Jest)"),
    numberedItem("Static code analysis with SonarQube"),
    numberedItem("Security scanning: Trivy (containers) + GitLeaks (secrets)"),
    numberedItem("Build and push Docker images to Docker Hub / ECR"),
    numberedItem("Deploy to Minikube or EKS using Helm Charts"),
    numberedItem("Run integration/API tests on the live deployment (Postman/Newman)"),
    numberedItem("Health check verification before marking deployment successful"),
    heading3("5. Monitoring & Observability"),
    bulletItem("Deploy Prometheus to monitor API response times and container resource usage"),
    bulletItem("Configure Alertmanager with notification channels (Slack, email)"),
    bulletItem("Create Grafana dashboards showing application metrics and API latency"),
    bulletItem("Set up log aggregation with ELK Stack or Loki + Promtail"),
    bulletItem("Implement custom Prometheus metrics in Flask using prometheus_flask_instrumentator"),
    heading3("6. Git Repository Structure"),
    bulletItem("App Repository: Flask app, React frontend, Dockerfiles, docker-compose.yml, unit tests"),
    bulletItem("DevOps Repository: Terraform modules, Kubernetes manifests, Helm charts, Jenkinsfile, monitoring configs"),
  ];
}

function cicdPipelineStages() {
  return [
    heading3("CI/CD Pipeline Stages"),
    spacer(40),
    techStackTable([
      ["Stage 1: Lint", "Flake8 (Python), ESLint (React), Hadolint (Dockerfile)"],
      ["Stage 2: Test", "pytest (backend), Jest (frontend), coverage reports"],
      ["Stage 3: SAST", "SonarQube quality gate check"],
      ["Stage 4: Security", "Trivy container scan, GitLeaks secret scan"],
      ["Stage 5: Build", "Docker multi-stage build + push to registry"],
      ["Stage 6: Deploy", "Helm upgrade to Kubernetes (dev/staging/prod)"],
      ["Stage 7: Verify", "Newman API tests + health check probes"],
      ["Stage 8: Monitor", "Prometheus + Grafana deployment verification"],
    ]),
  ];
}

// ─── PROJECT DEFINITIONS ───

function project1() {
  return [
    heading1("Project 1: Smart Retail Inventory System"),
    heading2("Business Use Case"),
    bodyText("Develop an inventory management system for a retail store chain. The application tracks stock levels in real-time, notifies store managers when items run low, and allows them to place restocking orders."),
    heading2("Features"),
    bulletItem("REST API in Flask to manage stock CRUD operations and restocking"),
    bulletItem("Fetch stock analytics and trends"),
    bulletItem("Optional React frontend for store managers to visualize stock levels and manage inventory"),
    bulletItem("PostgreSQL for data persistence with stock levels, products, and restocking logs"),
    ...standardDevOpsSection(),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Inventory Management"),
    codeEndpoint("GET", "/api/products", "Get a list of all products with stock levels"),
    codeEndpoint("GET", "/api/products/<product_id>", "Get details of a specific product"),
    codeEndpoint("POST", "/api/products", "Add a new product (name, SKU, stock level)"),
    codeEndpoint("PUT", "/api/products/<product_id>", "Update product details or stock level"),
    codeEndpoint("DELETE", "/api/products/<product_id>", "Delete a product from inventory"),
    heading3("Restocking Operations"),
    codeEndpoint("POST", "/api/products/<product_id>/restock", "Restock a specific product (quantity in payload)"),
    codeEndpoint("GET", "/api/restocks", "Get history of restocking logs"),
    heading3("Analytics"),
    codeEndpoint("GET", "/api/products/low-stock", "Get products with stock below threshold"),
    codeEndpoint("GET", "/api/products/analytics", "Fetch stock trend data for dashboard"),
    divider(),
  ];
}

function project2() {
  return [
    heading1("Project 2: IoT Data Aggregation System"),
    heading2("Business Use Case"),
    bodyText("Develop a platform that collects temperature and humidity data from IoT sensors deployed in different locations. The system stores this data and allows users to monitor trends."),
    heading2("Features"),
    bulletItem("Flask app to ingest sensor data and expose analytics endpoints"),
    bulletItem("Optional React dashboard to visualize data trends (line charts, heatmaps)"),
    bulletItem("PostgreSQL to store sensor data with StatefulSet deployment"),
    bulletItem("Multistage Docker builds to optimize images"),
    ...standardDevOpsSection(),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Sensor Data Ingestion"),
    codeEndpoint("POST", "/api/sensors", "Add a new sensor (sensor_id, location, type)"),
    codeEndpoint("POST", "/api/sensors/<sensor_id>/data", "Send data from a sensor (timestamp, value)"),
    heading3("Data Retrieval"),
    codeEndpoint("GET", "/api/sensors", "Get all sensors and their metadata"),
    codeEndpoint("GET", "/api/sensors/<sensor_id>/data", "Fetch data with date range (start_date, end_date)"),
    codeEndpoint("GET", "/api/sensors/analytics", "Get aggregated data (avg, min, max, trends)"),
    heading3("Sensor Configuration"),
    codeEndpoint("PUT", "/api/sensors/<sensor_id>", "Update sensor metadata (location, thresholds)"),
    codeEndpoint("DELETE", "/api/sensors/<sensor_id>", "Remove a sensor"),
    divider(),
  ];
}

function project3() {
  return [
    heading1("Project 3: Financial Portfolio Tracker"),
    heading2("Business Use Case"),
    bodyText("Create an app that helps users track investments, calculate portfolio growth, and fetch real-time stock market data via an external API."),
    heading2("Features"),
    bulletItem("Flask app for user authentication, CRUD operations on investments, and fetching stock data"),
    bulletItem("Optional React interface for data visualization (portfolio graphs, real-time price updates)"),
    bulletItem("PostgreSQL database for storing portfolio data"),
    bulletItem("External stock market API integration"),
    ...standardDevOpsSection(),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Portfolio Management"),
    codeEndpoint("GET", "/api/portfolio", "Get the current portfolio (list of investments)"),
    codeEndpoint("POST", "/api/portfolio", "Add a new investment (ticker, quantity, buy_price)"),
    codeEndpoint("PUT", "/api/portfolio/<investment_id>", "Update an investment"),
    codeEndpoint("DELETE", "/api/portfolio/<investment_id>", "Remove an investment"),
    heading3("Real-Time Stock Data"),
    codeEndpoint("GET", "/api/stocks/<ticker>", "Get real-time stock data for a ticker"),
    codeEndpoint("GET", "/api/stocks/market", "Get market trends and updates"),
    heading3("Portfolio Analytics"),
    codeEndpoint("GET", "/api/portfolio/analytics", "Fetch profit/loss data and growth trends"),
    divider(),
  ];
}

function project4() {
  return [
    heading1("Project 4: Multi-Language Blogging Platform"),
    heading2("Business Use Case"),
    bodyText("Build a blogging platform that supports English and another language with translation management and localization features."),
    heading2("Features"),
    bulletItem("Flask APIs for blog creation, editing, and translation management"),
    bulletItem("React dashboard (optional) for writing and managing posts"),
    bulletItem("PostgreSQL to store blog content with localization support"),
    bulletItem("ConfigMaps for localization settings"),
    ...standardDevOpsSection(),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Blog Management"),
    codeEndpoint("GET", "/api/blogs", "Get a list of all blog posts"),
    codeEndpoint("GET", "/api/blogs/<blog_id>", "Get details of a specific blog post"),
    codeEndpoint("POST", "/api/blogs", "Create a new blog post (title, content, language)"),
    codeEndpoint("PUT", "/api/blogs/<blog_id>", "Update an existing blog post"),
    codeEndpoint("DELETE", "/api/blogs/<blog_id>", "Delete a blog post"),
    heading3("Localization"),
    codeEndpoint("POST", "/api/blogs/<blog_id>/translate", "Translate a blog post (language in payload)"),
    codeEndpoint("GET", "/api/blogs/<blog_id>/translations", "Get all translations of a blog post"),
    divider(),
  ];
}

function project5() {
  return [
    heading1("Project 5: Smart Home Control Panel"),
    heading2("Business Use Case"),
    bodyText("Develop a web application to control smart home devices, like lights and thermostats, with real-time device status and analytics."),
    heading2("Features"),
    bulletItem("Flask APIs to send commands to devices via MQTT"),
    bulletItem("Optional React UI for device control dashboard"),
    bulletItem("PostgreSQL for device configuration and analytics storage"),
    ...standardDevOpsSection(),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Device Control"),
    codeEndpoint("GET", "/api/devices", "Get all smart devices with their status"),
    codeEndpoint("POST", "/api/devices", "Register a new device (device_id, type, location)"),
    codeEndpoint("PUT", "/api/devices/<device_id>", "Update device configuration or status"),
    codeEndpoint("DELETE", "/api/devices/<device_id>", "Remove a smart device"),
    heading3("Real-Time Actions"),
    codeEndpoint("POST", "/api/devices/<device_id>/action", "Send a command to a device"),
    heading3("Device Analytics"),
    codeEndpoint("GET", "/api/devices/analytics", "Fetch usage patterns and status trends"),
    divider(),
  ];
}

function project6() {
  return [
    heading1("Project 6: Real-Time Chat App"),
    heading2("Business Use Case"),
    bodyText("Create a real-time chat application for users to communicate securely with WebSocket support for instant messaging."),
    heading2("Features"),
    bulletItem("Flask WebSocket backend for real-time messaging (Flask-SocketIO)"),
    bulletItem("Optional React interface for chat UI"),
    bulletItem("PostgreSQL for user data and message history"),
    bulletItem("Kubernetes Ingress configured for WebSocket communication"),
    ...standardDevOpsSection(),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("User Management"),
    codeEndpoint("POST", "/api/users/register", "Register a new user"),
    codeEndpoint("POST", "/api/users/login", "Authenticate and return session token"),
    codeEndpoint("GET", "/api/users", "Fetch all users (admin only)"),
    heading3("Messaging"),
    codeEndpoint("GET", "/api/chats", "Get all chats for current user"),
    codeEndpoint("POST", "/api/chats", "Start a new chat (recipient_id)"),
    codeEndpoint("POST", "/api/chats/<chat_id>/message", "Send a message in a chat"),
    codeEndpoint("GET", "/api/chats/<chat_id>", "Fetch messages in a chat"),
    heading3("Real-Time Communication"),
    codeEndpoint("WS", "/ws/chat/<chat_id>", "WebSocket endpoint for real-time chat"),
    divider(),
  ];
}

function project7() {
  return [
    heading1("Project 7: Multi-Environment Microservice Platform"),
    heading2("Business Use Case"),
    bodyText("Create a scalable, multi-environment microservice platform that simulates a production-grade deployment pipeline with multiple Flask services communicating via REST APIs."),
    heading2("Features"),
    bulletItem("Multiple Flask microservices communicating via REST APIs"),
    bulletItem("Service discovery and load balancing"),
    bulletItem("Environment-specific configurations (dev, staging, prod)"),
    bulletItem("Namespaces for environment isolation in Kubernetes"),
    bulletItem("Helm charts for package management"),
    ...standardDevOpsSection(),
    heading3("Additional Tech Stack"),
    techStackTable([
      ["Service Mesh", "Istio (optional) for traffic management and mTLS"],
      ["Infrastructure", "Terraform with remote backend + workspaces"],
      ["Deployment Strategy", "Blue/Green deployment to production"],
      ["Performance Testing", "Locust or k6 for load testing in staging"],
    ]),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Service Registry"),
    codeEndpoint("GET", "/api/services", "List all available services"),
    codeEndpoint("GET", "/api/services/{service-id}/health", "Check health of specific service"),
    heading3("User Service"),
    codeEndpoint("POST", "/api/users", "Create new user"),
    codeEndpoint("GET", "/api/users/{id}", "Get user details"),
    codeEndpoint("PUT", "/api/users/{id}", "Update user"),
    heading3("Product Service"),
    codeEndpoint("GET", "/api/products", "List all products"),
    codeEndpoint("POST", "/api/products", "Create new product"),
    codeEndpoint("GET", "/api/products/{id}", "Get product details"),
    heading3("Order Service"),
    codeEndpoint("POST", "/api/orders", "Create new order"),
    codeEndpoint("GET", "/api/orders/{id}", "Get order details"),
    codeEndpoint("PUT", "/api/orders/{id}/status", "Update order status"),
    divider(),
  ];
}

function project8() {
  return [
    heading1("Project 8: Automated Disaster Recovery System"),
    heading2("Business Use Case"),
    bodyText("Build a resilient system with automated disaster recovery capabilities for critical business applications, including auto-healing, backup verification, and cross-region failover."),
    heading2("Features"),
    bulletItem("Auto-healing infrastructure with Kubernetes operators"),
    bulletItem("Regular backup and restore verification"),
    bulletItem("Cross-region failover capabilities"),
    bulletItem("Chaos engineering components (Chaos Mesh)"),
    ...standardDevOpsSection(),
    heading3("Additional Tech Stack"),
    techStackTable([
      ["Chaos Engineering", "Chaos Mesh for fault injection"],
      ["Backup", "Kubernetes Volume Snapshots + Velero"],
      ["Multi-Region", "Terraform multi-region modules"],
      ["Incident Response", "Automated DR runbooks as executable scripts"],
    ]),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("System Health"),
    codeEndpoint("GET", "/api/health", "Overall system health check"),
    codeEndpoint("GET", "/api/health/components", "Status of all system components"),
    heading3("Backup Management"),
    codeEndpoint("POST", "/api/backups", "Trigger a manual backup"),
    codeEndpoint("GET", "/api/backups", "List all available backups"),
    codeEndpoint("POST", "/api/backups/{id}/restore", "Restore from a specific backup"),
    heading3("Chaos Testing"),
    codeEndpoint("POST", "/api/chaos/experiments", "Start a new chaos experiment"),
    codeEndpoint("GET", "/api/chaos/experiments", "List all chaos experiments"),
    codeEndpoint("GET", "/api/chaos/experiments/{id}/results", "Get experiment results"),
    heading3("Failover Management"),
    codeEndpoint("POST", "/api/failover", "Trigger manual failover to DR"),
    codeEndpoint("GET", "/api/failover/status", "Check current failover status"),
    codeEndpoint("POST", "/api/failover/rollback", "Roll back to primary region"),
    divider(),
  ];
}

function project9() {
  return [
    heading1("Project 9: Global Multi-Cloud Resilient Platform"),
    heading2("Business Use Case"),
    bodyText("Develop a mission-critical platform that operates across multiple cloud providers with zero downtime guarantee, global distribution, and regulatory compliance for different regions."),
    heading2("Features"),
    bulletItem("Active-active multi-cloud deployment (AWS, GCP, Azure)"),
    bulletItem("Global data synchronization with conflict resolution"),
    bulletItem("Regional compliance enforcement (GDPR, CCPA)"),
    bulletItem("Sub-second failover between providers"),
    ...standardDevOpsSection(),
    heading3("Additional Tech Stack"),
    techStackTable([
      ["Service Mesh", "Istio / Linkerd for cross-cloud mTLS"],
      ["Secrets", "HashiCorp Vault with JIT credential issuance"],
      ["Policy Engine", "OPA / Gatekeeper for runtime security"],
      ["Multi-Cluster", "KubeFed for Kubernetes federation"],
      ["GitOps", "ArgoCD / Flux for multi-cluster GitOps"],
      ["Observability", "Thanos/Cortex for Prometheus federation"],
      ["Tracing", "Jaeger for distributed tracing"],
    ]),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Platform Management"),
    codeEndpoint("GET", "/api/platform/status", "Global platform health status"),
    codeEndpoint("GET", "/api/platform/regions", "Status across all regions"),
    codeEndpoint("POST", "/api/platform/regions/{region}/evacuate", "Evacuate workload from region"),
    heading3("Multi-Cloud Operations"),
    codeEndpoint("POST", "/api/clouds/{provider}/scale", "Scale resources on specific provider"),
    codeEndpoint("GET", "/api/clouds/cost", "Real-time cost analysis across clouds"),
    codeEndpoint("GET", "/api/clouds/comparison", "Performance comparison between providers"),
    heading3("Compliance"),
    codeEndpoint("GET", "/api/compliance/regions/{region}", "Compliance status for region"),
    codeEndpoint("POST", "/api/compliance/audit", "Trigger compliance audit"),
    codeEndpoint("GET", "/api/compliance/data-residency", "Data residency verification"),
    heading3("Global Traffic Management"),
    codeEndpoint("GET", "/api/traffic/distribution", "Current traffic distribution"),
    codeEndpoint("POST", "/api/traffic/shift", "Shift traffic between regions"),
    codeEndpoint("GET", "/api/traffic/latency", "Global latency heat map"),
    divider(),
  ];
}

function project10() {
  return [
    heading1("Project 10: Autonomous Self-Evolving Infrastructure"),
    heading2("Business Use Case"),
    bodyText("Create an infrastructure platform that evolves itself based on usage patterns, security threats, and performance metrics, minimizing human intervention for routine operations."),
    heading2("Features"),
    bulletItem("Self-optimizing infrastructure based on ML-driven insights"),
    bulletItem("Predictive scaling before demand spikes"),
    bulletItem("Automatic vulnerability remediation"),
    bulletItem("Intelligent resource allocation"),
    ...standardDevOpsSection(),
    heading3("Additional Tech Stack"),
    techStackTable([
      ["ML Pipeline", "Python ML models for infrastructure optimization"],
      ["Event Processing", "Apache Kafka / NATS for real-time events"],
      ["Self-Healing", "Custom Kubernetes operators for auto-remediation"],
      ["Security", "RASP + automated penetration testing"],
      ["Database Tuning", "Self-tuning PostgreSQL with autonomous optimization"],
    ]),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("System Intelligence"),
    codeEndpoint("GET", "/api/intelligence/recommendations", "Infrastructure improvement recommendations"),
    codeEndpoint("GET", "/api/intelligence/forecasts", "Resource usage forecasts"),
    codeEndpoint("GET", "/api/intelligence/anomalies", "Detected system anomalies"),
    heading3("Self-Healing"),
    codeEndpoint("GET", "/api/healing/incidents", "Current and past self-healed incidents"),
    codeEndpoint("GET", "/api/healing/playbooks", "Available auto-remediation playbooks"),
    codeEndpoint("POST", "/api/healing/override", "Override automated healing decision"),
    heading3("Resource Optimization"),
    codeEndpoint("GET", "/api/optimization/savings", "Cost optimization insights"),
    codeEndpoint("GET", "/api/optimization/bottlenecks", "Current system bottlenecks"),
    codeEndpoint("POST", "/api/optimization/apply", "Apply optimization recommendation"),
    heading3("Security Automation"),
    codeEndpoint("GET", "/api/security/vulnerabilities", "Detected vulnerabilities"),
    codeEndpoint("GET", "/api/security/remediations", "Automated security fixes"),
    codeEndpoint("POST", "/api/security/scan", "Trigger security assessment"),
    divider(),
  ];
}

function project11() {
  return [
    heading1("Project 11: AI Code Review Assistant"),
    heading2("Business Use Case"),
    bodyText("A web app where developers submit code snippets and receive instant AI-powered security and quality feedback using an LLM (e.g., Claude/OpenAI)."),
    heading2("Features"),
    bulletItem("Flask API that sends code to an LLM for review"),
    bulletItem("Optional React UI for code submission and results display"),
    bulletItem("PostgreSQL for storing review history and analytics"),
    ...standardDevOpsSection(),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Code Review"),
    codeEndpoint("POST", "/api/review", "Submit a code snippet for AI review (code, language)"),
    codeEndpoint("GET", "/api/review/<review_id>", "Retrieve a specific review result"),
    codeEndpoint("GET", "/api/reviews", "List all past reviews with metadata"),
    codeEndpoint("DELETE", "/api/review/<review_id>", "Delete a stored review"),
    heading3("Languages & Config"),
    codeEndpoint("GET", "/api/languages", "Get supported programming languages"),
    codeEndpoint("PUT", "/api/config", "Update review parameters (strictness, focus areas)"),
    heading3("Analytics"),
    codeEndpoint("GET", "/api/analytics", "Stats on common issues, languages, avg response time"),
    divider(),
  ];
}

function project12() {
  return [
    heading1("Project 12: AI Document Summarizer & Q&A"),
    heading2("Business Use Case"),
    bodyText("Upload PDFs or text documents and get AI-generated summaries or ask questions about the content -- useful for legal, HR, or research teams. Uses RAG-style architecture with an LLM."),
    heading2("Features"),
    bulletItem("Flask API for document upload and AI querying (RAG-style)"),
    bulletItem("Optional React UI for upload and chat-style Q&A"),
    bulletItem("PostgreSQL + PersistentVolumes for file storage"),
    ...standardDevOpsSection(),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Documents"),
    codeEndpoint("POST", "/api/documents", "Upload a new document (PDF or .txt)"),
    codeEndpoint("GET", "/api/documents", "List all uploaded documents with metadata"),
    codeEndpoint("GET", "/api/documents/<doc_id>", "Get details and summary of a document"),
    codeEndpoint("DELETE", "/api/documents/<doc_id>", "Remove a document"),
    heading3("Q&A"),
    codeEndpoint("POST", "/api/documents/<doc_id>/ask", "Ask a question about a document"),
    codeEndpoint("GET", "/api/documents/<doc_id>/history", "Get full Q&A history"),
    heading3("Analytics"),
    codeEndpoint("GET", "/api/analytics", "Stats on most queried docs, avg summary length"),
    divider(),
  ];
}

function project13() {
  return [
    heading1("Project 13: AI-Powered Job Application Screener"),
    heading2("Business Use Case"),
    bodyText("HR teams upload job descriptions and candidate CVs; the AI scores and ranks applicants automatically using LLM-based evaluation."),
    heading2("Features"),
    bulletItem("Flask API for CV and job description ingestion, AI scoring via LLM"),
    bulletItem("Optional React UI for uploading and viewing ranked candidates"),
    bulletItem("PostgreSQL for storing jobs, candidates, and scores"),
    ...standardDevOpsSection(),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Jobs"),
    codeEndpoint("POST", "/api/jobs", "Create a new job posting (title, description, requirements)"),
    codeEndpoint("GET", "/api/jobs", "List all job postings"),
    codeEndpoint("PUT", "/api/jobs/<job_id>", "Update a job description"),
    codeEndpoint("DELETE", "/api/jobs/<job_id>", "Remove a job posting"),
    heading3("Candidates"),
    codeEndpoint("POST", "/api/jobs/<job_id>/candidates", "Upload a candidate CV for a job"),
    codeEndpoint("GET", "/api/jobs/<job_id>/candidates", "Get ranked list of candidates"),
    codeEndpoint("GET", "/api/jobs/<job_id>/candidates/<candidate_id>", "Detailed AI score and feedback"),
    codeEndpoint("DELETE", "/api/jobs/<job_id>/candidates/<candidate_id>", "Remove a candidate"),
    heading3("Analytics"),
    codeEndpoint("GET", "/api/analytics", "Avg scores per job, applicant count, screening time"),
    divider(),
  ];
}

function project14() {
  return [
    heading1("Project 14: Multi-Cloud Kubernetes GitOps Platform"),
    heading2("Business Use Case"),
    bodyText("A production-grade platform that manages microservices deployment across multiple cloud providers using GitOps principles -- simulating how companies like Spotify or Netflix manage their infrastructure."),
    heading2("Features"),
    bulletItem("Multi-service app (user service, order service, notification service) in Flask"),
    bulletItem("GitOps workflow using ArgoCD for continuous deployment"),
    bulletItem("Istio service mesh for traffic management, mTLS, and observability"),
    bulletItem("HashiCorp Vault for secrets management"),
    ...standardDevOpsSection(),
    heading3("Additional Tech Stack"),
    techStackTable([
      ["GitOps", "ArgoCD (auto-sync on merge)"],
      ["Service Mesh", "Istio (canary deployments, circuit breaking, mTLS)"],
      ["Secrets", "HashiCorp Vault (dynamic injection into pods)"],
      ["Tracing", "Jaeger for distributed tracing across microservices"],
    ]),
    ...cicdPipelineStages(),
    heading2("API Endpoints (Order Service Example)"),
    heading3("Orders"),
    codeEndpoint("POST", "/api/orders", "Create a new order"),
    codeEndpoint("GET", "/api/orders/<order_id>", "Get order details"),
    codeEndpoint("PUT", "/api/orders/<order_id>", "Update order status"),
    codeEndpoint("DELETE", "/api/orders/<order_id>", "Cancel an order"),
    heading3("Health"),
    codeEndpoint("GET", "/health/live", "Liveness probe"),
    codeEndpoint("GET", "/health/ready", "Readiness probe"),
    heading3("Metrics"),
    codeEndpoint("GET", "/metrics", "Prometheus scrape endpoint"),
    divider(),
  ];
}

function project15() {
  return [
    heading1("Project 15: DevSecOps Pipeline with Full Security Scanning"),
    heading2("Business Use Case"),
    bodyText("A secure e-commerce backend where every code change is automatically scanned for vulnerabilities, secrets, license violations, and misconfigurations before reaching production -- modeled after financial/healthcare compliance pipelines."),
    heading2("Features"),
    bulletItem("Flask e-commerce REST API (products, cart, orders)"),
    bulletItem("Full shift-left security baked into every CI stage"),
    bulletItem("SBOM (Software Bill of Materials) generation on every build"),
    bulletItem("Automated compliance reporting"),
    ...standardDevOpsSection(),
    heading3("Additional Security Stack"),
    techStackTable([
      ["SAST", "SonarQube"],
      ["Dependency Scanning", "OWASP Dependency-Check / Snyk"],
      ["Container Scanning", "Trivy"],
      ["Secret Detection", "GitLeaks"],
      ["IaC Scanning", "Checkov (for K8s manifests)"],
      ["DAST", "OWASP ZAP"],
      ["SBOM", "Syft + Grype"],
    ]),
    heading3("Security Gates (Pipeline Fails If)"),
    bulletItem("Any CRITICAL CVE found by Trivy"),
    bulletItem("Any secret detected by GitLeaks"),
    bulletItem("SonarQube Quality Gate fails"),
    bulletItem("Checkov finds HIGH severity misconfigs in K8s manifests"),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Products"),
    codeEndpoint("GET", "/api/products", "List all products"),
    codeEndpoint("POST", "/api/products", "Add a new product"),
    codeEndpoint("PUT", "/api/products/<product_id>", "Update product details"),
    codeEndpoint("DELETE", "/api/products/<product_id>", "Remove a product"),
    heading3("Cart"),
    codeEndpoint("POST", "/api/cart", "Add item to cart (product_id, quantity)"),
    codeEndpoint("GET", "/api/cart/<user_id>", "Get cart contents for a user"),
    codeEndpoint("DELETE", "/api/cart/<user_id>/item/<product_id>", "Remove item from cart"),
    heading3("Orders"),
    codeEndpoint("POST", "/api/orders", "Place an order from cart"),
    codeEndpoint("GET", "/api/orders/<order_id>", "Get order status"),
    heading3("Security Reports"),
    codeEndpoint("GET", "/api/security/sbom", "Retrieve latest SBOM"),
    codeEndpoint("GET", "/api/security/scan-report", "Get latest vulnerability scan summary"),
    divider(),
  ];
}

function project16() {
  return [
    heading1("Project 16: Real-Time Event-Driven Data Pipeline Platform"),
    heading2("Business Use Case"),
    bodyText("A high-throughput platform that ingests, processes, and visualizes real-time events (website clickstream, server logs, IoT sensor data) -- the kind of system used by e-commerce companies to track user behavior at scale."),
    heading2("Features"),
    bulletItem("Event producer service that generates and publishes events to Kafka"),
    bulletItem("Stream processor service that consumes, transforms, and stores events"),
    bulletItem("ELK Stack (Elasticsearch, Logstash, Kibana) for search and visualization"),
    bulletItem("Kafka UI for topic and consumer group management"),
    ...standardDevOpsSection(),
    heading3("Additional Tech Stack"),
    techStackTable([
      ["Message Broker", "Apache Kafka + Zookeeper (3 brokers, replication factor 3)"],
      ["Stream Processing", "Python consumer (kafka-python)"],
      ["Search & Storage", "Elasticsearch"],
      ["Log Pipeline", "Logstash (Kafka topic -> parse -> Elasticsearch)"],
      ["Visualization", "Kibana + Grafana"],
      ["Kafka Monitoring", "Kafka Exporter for Prometheus"],
    ]),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Events"),
    codeEndpoint("POST", "/api/events", "Publish a new event to Kafka (event_type, payload, source)"),
    codeEndpoint("GET", "/api/events/topics", "List all available Kafka topics"),
    codeEndpoint("POST", "/api/events/topics", "Create a new Kafka topic (name, partitions, replication)"),
    heading3("Consumer Groups"),
    codeEndpoint("GET", "/api/consumers", "List all consumer groups and their lag"),
    codeEndpoint("GET", "/api/consumers/<group_id>", "Detailed lag per partition"),
    heading3("Pipeline Health"),
    codeEndpoint("GET", "/health/kafka", "Check Kafka broker connectivity"),
    codeEndpoint("GET", "/health/elasticsearch", "Check Elasticsearch cluster status"),
    codeEndpoint("GET", "/api/analytics", "Throughput stats: events/sec, avg latency, error rate"),
    divider(),
  ];
}

// ─── 5 NEW PROJECTS ───

function project17() {
  return [
    heading1("Project 17: Online Learning Management System (LMS)"),
    heading2("Business Use Case"),
    bodyText("Build a comprehensive online learning platform where instructors can create courses with video lectures, quizzes, and assignments, and students can enroll, track progress, and earn certificates upon completion. The system supports multiple concurrent users and provides analytics on student engagement and course performance."),
    heading2("Features"),
    bulletItem("Flask REST API for course management, enrollment, progress tracking, and certificate generation"),
    bulletItem("Optional React frontend with video player, quiz engine, and progress dashboard"),
    bulletItem("PostgreSQL database for courses, users, enrollments, quiz results, and certificates"),
    bulletItem("File storage (S3-compatible via MinIO or PersistentVolumes) for video content and PDFs"),
    bulletItem("Role-based access control (RBAC) for admins, instructors, and students"),
    bulletItem("Email notification service for enrollment confirmations and certificate delivery"),
    bulletItem("Redis caching layer for frequently accessed course catalogs and leaderboards"),
    ...standardDevOpsSection(),
    heading3("Additional Tech Stack"),
    techStackTable([
      ["Caching", "Redis (deployed as StatefulSet in Kubernetes)"],
      ["Object Storage", "MinIO (S3-compatible) or AWS S3 via Terraform"],
      ["Email Service", "Flask-Mail with SMTP or AWS SES"],
      ["Task Queue", "Celery + Redis for async certificate generation and email"],
      ["Video Processing", "FFmpeg container for video transcoding (optional)"],
      ["Authentication", "JWT (Flask-JWT-Extended) with refresh tokens"],
    ]),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Course Management"),
    codeEndpoint("GET", "/api/courses", "List all available courses with filters (category, level, rating)"),
    codeEndpoint("GET", "/api/courses/<course_id>", "Get detailed course info (modules, instructor, ratings)"),
    codeEndpoint("POST", "/api/courses", "Create a new course (title, description, modules, price)"),
    codeEndpoint("PUT", "/api/courses/<course_id>", "Update course details or add new modules"),
    codeEndpoint("DELETE", "/api/courses/<course_id>", "Archive or delete a course"),
    heading3("Enrollment & Progress"),
    codeEndpoint("POST", "/api/courses/<course_id>/enroll", "Enroll current user in a course"),
    codeEndpoint("GET", "/api/users/<user_id>/enrollments", "Get all enrollments and progress for a user"),
    codeEndpoint("PUT", "/api/courses/<course_id>/progress", "Update progress (mark lesson complete, submit quiz)"),
    codeEndpoint("GET", "/api/courses/<course_id>/leaderboard", "Get course leaderboard by quiz scores"),
    heading3("Quizzes & Assignments"),
    codeEndpoint("POST", "/api/courses/<course_id>/quizzes", "Create a quiz for a course module"),
    codeEndpoint("POST", "/api/quizzes/<quiz_id>/submit", "Submit quiz answers and get instant score"),
    codeEndpoint("GET", "/api/quizzes/<quiz_id>/results", "Get quiz results for current user"),
    heading3("Certificates & Analytics"),
    codeEndpoint("GET", "/api/users/<user_id>/certificates", "List all earned certificates"),
    codeEndpoint("GET", "/api/courses/<course_id>/analytics", "Completion rates, avg scores, engagement metrics"),
    codeEndpoint("GET", "/api/analytics/platform", "Platform-wide stats: total users, courses, completions"),
    divider(),
  ];
}

function project18() {
  return [
    heading1("Project 18: Healthcare Appointment & Records System"),
    heading2("Business Use Case"),
    bodyText("Develop a healthcare management platform where patients can book appointments with doctors, view their medical history, and receive prescriptions. Doctors can manage their schedules, update patient records, and generate reports. The system enforces data privacy regulations and audit logging for all access to sensitive records."),
    heading2("Features"),
    bulletItem("Flask REST API for patient management, appointment scheduling, and medical records"),
    bulletItem("Optional React frontend with calendar booking UI, patient dashboard, and doctor portal"),
    bulletItem("PostgreSQL database with encrypted columns for sensitive health data"),
    bulletItem("Role-based access: patients, doctors, nurses, admin staff"),
    bulletItem("Full audit trail logging for all data access (compliance-ready)"),
    bulletItem("Appointment reminder notifications via email/webhook"),
    bulletItem("PDF generation for prescriptions and medical reports"),
    ...standardDevOpsSection(),
    heading3("Additional Tech Stack"),
    techStackTable([
      ["Data Encryption", "PostgreSQL pgcrypto extension for column-level encryption"],
      ["Audit Logging", "Custom Flask middleware + ELK Stack for compliance audit trails"],
      ["PDF Generation", "WeasyPrint or ReportLab for prescription/report PDFs"],
      ["Task Queue", "Celery + Redis for appointment reminders and report generation"],
      ["Authentication", "JWT with OAuth 2.0 (Flask-JWT-Extended + Flask-OAuthlib)"],
      ["API Documentation", "Swagger/OpenAPI via Flask-RESTX or Flasgger"],
      ["Rate Limiting", "Flask-Limiter for API abuse prevention"],
    ]),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Patient Management"),
    codeEndpoint("POST", "/api/patients", "Register a new patient (name, DOB, contact, insurance)"),
    codeEndpoint("GET", "/api/patients", "List patients (admin/doctor only, with search filters)"),
    codeEndpoint("GET", "/api/patients/<patient_id>", "Get patient profile and summary"),
    codeEndpoint("PUT", "/api/patients/<patient_id>", "Update patient information"),
    codeEndpoint("DELETE", "/api/patients/<patient_id>", "Deactivate a patient record"),
    heading3("Appointments"),
    codeEndpoint("GET", "/api/doctors", "List all doctors with specialties and availability"),
    codeEndpoint("GET", "/api/doctors/<doctor_id>/slots", "Get available appointment slots"),
    codeEndpoint("POST", "/api/appointments", "Book an appointment (patient_id, doctor_id, datetime)"),
    codeEndpoint("GET", "/api/appointments", "List appointments (filtered by user role)"),
    codeEndpoint("PUT", "/api/appointments/<appt_id>", "Reschedule or update appointment status"),
    codeEndpoint("DELETE", "/api/appointments/<appt_id>", "Cancel an appointment"),
    heading3("Medical Records"),
    codeEndpoint("POST", "/api/patients/<patient_id>/records", "Create a medical record entry (diagnosis, notes)"),
    codeEndpoint("GET", "/api/patients/<patient_id>/records", "Get patient medical history"),
    codeEndpoint("POST", "/api/patients/<patient_id>/prescriptions", "Issue a prescription"),
    codeEndpoint("GET", "/api/patients/<patient_id>/prescriptions", "List all prescriptions"),
    heading3("Analytics & Audit"),
    codeEndpoint("GET", "/api/analytics/appointments", "Appointment volume, no-show rates, peak hours"),
    codeEndpoint("GET", "/api/analytics/doctors", "Doctor utilization and patient satisfaction"),
    codeEndpoint("GET", "/api/audit/logs", "Access audit trail logs (admin only, paginated)"),
    divider(),
  ];
}

function project19() {
  return [
    heading1("Project 19: E-Commerce Marketplace with Recommendation Engine"),
    heading2("Business Use Case"),
    bodyText("Build a multi-vendor e-commerce marketplace where sellers list products, buyers browse and purchase items, and a recommendation engine suggests products based on browsing history and purchase patterns. The platform handles user reviews, shopping cart, order processing, and payment tracking with a microservices-inspired architecture."),
    heading2("Features"),
    bulletItem("Flask REST API with separate modules for products, orders, users, and recommendations"),
    bulletItem("Optional React frontend with product catalog, shopping cart, checkout flow, and recommendation widgets"),
    bulletItem("PostgreSQL database for products, orders, users, reviews, and recommendation data"),
    bulletItem("Redis for session management, shopping cart state, and recommendation caching"),
    bulletItem("Background recommendation engine using collaborative filtering (pandas/scikit-learn)"),
    bulletItem("Webhook notifications for order status updates"),
    bulletItem("Full-text search across product catalog"),
    ...standardDevOpsSection(),
    heading3("Additional Tech Stack"),
    techStackTable([
      ["Search Engine", "Elasticsearch for full-text product search and faceted filtering"],
      ["Caching / Sessions", "Redis (shopping cart, sessions, recommendation cache)"],
      ["ML / Recommendations", "scikit-learn + pandas for collaborative filtering model"],
      ["Task Queue", "Celery + Redis for order processing and recommendation updates"],
      ["Payment Tracking", "Simulated payment gateway with webhook callbacks"],
      ["API Gateway", "NGINX Ingress with path-based routing to microservice modules"],
      ["Image Storage", "MinIO (S3-compatible) for product images"],
    ]),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Product Catalog"),
    codeEndpoint("GET", "/api/products", "List products with search, filters, and pagination"),
    codeEndpoint("GET", "/api/products/<product_id>", "Get product details with reviews and ratings"),
    codeEndpoint("POST", "/api/products", "Create a product listing (seller only)"),
    codeEndpoint("PUT", "/api/products/<product_id>", "Update product details (seller only)"),
    codeEndpoint("DELETE", "/api/products/<product_id>", "Remove a product listing"),
    codeEndpoint("GET", "/api/products/search", "Full-text search with Elasticsearch"),
    heading3("Shopping Cart & Orders"),
    codeEndpoint("GET", "/api/cart", "Get current user's cart contents"),
    codeEndpoint("POST", "/api/cart/items", "Add item to cart (product_id, quantity)"),
    codeEndpoint("PUT", "/api/cart/items/<item_id>", "Update cart item quantity"),
    codeEndpoint("DELETE", "/api/cart/items/<item_id>", "Remove item from cart"),
    codeEndpoint("POST", "/api/orders", "Place an order from cart (creates order, clears cart)"),
    codeEndpoint("GET", "/api/orders", "List current user's orders"),
    codeEndpoint("GET", "/api/orders/<order_id>", "Get order details and tracking status"),
    heading3("Reviews & Recommendations"),
    codeEndpoint("POST", "/api/products/<product_id>/reviews", "Submit a product review (rating, text)"),
    codeEndpoint("GET", "/api/products/<product_id>/reviews", "Get all reviews for a product"),
    codeEndpoint("GET", "/api/recommendations", "Get personalized product recommendations"),
    codeEndpoint("GET", "/api/products/<product_id>/similar", "Get similar products"),
    heading3("Seller & Analytics"),
    codeEndpoint("GET", "/api/sellers/<seller_id>/products", "List all products for a seller"),
    codeEndpoint("GET", "/api/sellers/<seller_id>/analytics", "Sales volume, revenue, top products"),
    codeEndpoint("GET", "/api/analytics/platform", "Platform-wide GMV, order volume, top categories"),
    divider(),
  ];
}

function project20() {
  return [
    heading1("Project 20: Fleet Management & Vehicle Tracking System"),
    heading2("Business Use Case"),
    bodyText("Build a fleet management platform for logistics companies to track vehicles in real-time, optimize delivery routes, monitor driver behavior, and manage vehicle maintenance schedules. The system ingests GPS data from vehicle trackers, calculates ETAs, generates delivery reports, and alerts dispatchers about anomalies such as route deviations or excessive idle time."),
    heading2("Features"),
    bulletItem("Flask REST API for vehicle management, trip tracking, route optimization, and maintenance scheduling"),
    bulletItem("Optional React frontend with live map (Leaflet.js / Mapbox), vehicle dashboard, and dispatcher console"),
    bulletItem("PostgreSQL with PostGIS extension for geospatial queries (nearest vehicle, geofencing)"),
    bulletItem("Redis Pub/Sub for real-time vehicle location broadcasting to connected clients"),
    bulletItem("Background workers for route optimization and anomaly detection"),
    bulletItem("WebSocket endpoint for live vehicle tracking updates"),
    bulletItem("Scheduled maintenance alerts and fuel consumption analytics"),
    ...standardDevOpsSection(),
    heading3("Additional Tech Stack"),
    techStackTable([
      ["Geospatial DB", "PostgreSQL + PostGIS for location queries and geofencing"],
      ["Real-Time Updates", "Redis Pub/Sub + Flask-SocketIO for live tracking"],
      ["Maps / Routing", "OpenRouteService API or OSRM for route optimization"],
      ["Task Queue", "Celery + Redis for async route calculations and alerts"],
      ["Time-Series Data", "TimescaleDB (PostgreSQL extension) for GPS telemetry"],
      ["Map Frontend", "Leaflet.js or Mapbox GL JS for live vehicle maps"],
      ["Alerting", "Prometheus Alertmanager + custom webhook for dispatch alerts"],
    ]),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Vehicle Management"),
    codeEndpoint("GET", "/api/vehicles", "List all vehicles with current status and location"),
    codeEndpoint("GET", "/api/vehicles/<vehicle_id>", "Get detailed vehicle info (mileage, status, driver)"),
    codeEndpoint("POST", "/api/vehicles", "Register a new vehicle (plate, type, capacity)"),
    codeEndpoint("PUT", "/api/vehicles/<vehicle_id>", "Update vehicle details or assign driver"),
    codeEndpoint("DELETE", "/api/vehicles/<vehicle_id>", "Decommission a vehicle"),
    heading3("Trip & Route Management"),
    codeEndpoint("POST", "/api/trips", "Create a new trip (vehicle_id, origin, destination, stops)"),
    codeEndpoint("GET", "/api/trips/<trip_id>", "Get trip details with route and ETA"),
    codeEndpoint("PUT", "/api/trips/<trip_id>/status", "Update trip status (in-progress, completed, cancelled)"),
    codeEndpoint("GET", "/api/trips/<trip_id>/route", "Get optimized route with waypoints"),
    codeEndpoint("POST", "/api/routes/optimize", "Calculate optimal route for multiple stops"),
    heading3("Real-Time Tracking"),
    codeEndpoint("POST", "/api/vehicles/<vehicle_id>/location", "Ingest GPS data (lat, lng, speed, heading, timestamp)"),
    codeEndpoint("GET", "/api/vehicles/<vehicle_id>/location/history", "Get location history with date range"),
    codeEndpoint("WS", "/ws/tracking/<vehicle_id>", "WebSocket for live vehicle location updates"),
    codeEndpoint("GET", "/api/vehicles/nearby", "Find vehicles near a coordinate (lat, lng, radius)"),
    heading3("Maintenance & Analytics"),
    codeEndpoint("POST", "/api/vehicles/<vehicle_id>/maintenance", "Schedule a maintenance event"),
    codeEndpoint("GET", "/api/vehicles/<vehicle_id>/maintenance", "Get maintenance history and upcoming schedule"),
    codeEndpoint("GET", "/api/analytics/fleet", "Fleet utilization, fuel consumption, avg delivery time"),
    codeEndpoint("GET", "/api/analytics/drivers", "Driver performance: routes completed, idle time, speed"),
    codeEndpoint("GET", "/api/analytics/alerts", "Anomaly alerts: route deviations, geofence breaches"),
    divider(),
  ];
}

function project21() {
  return [
    heading1("Project 21: Cloud-Native CI/CD Pipeline Marketplace"),
    heading2("Business Use Case"),
    bodyText("Build a platform where DevOps teams can discover, create, share, and deploy reusable CI/CD pipeline templates and infrastructure modules. Think of it as a GitHub Marketplace specifically for DevOps artifacts -- teams can publish Jenkinsfiles, GitHub Actions workflows, Terraform modules, Helm charts, and Docker Compose stacks, while other teams can search, rate, and deploy them directly into their own infrastructure."),
    heading2("Features"),
    bulletItem("Flask REST API for publishing, discovering, and deploying pipeline templates and IaC modules"),
    bulletItem("Optional React frontend with template gallery, search/filter UI, version comparison, and one-click deploy wizard"),
    bulletItem("PostgreSQL database for templates, users, ratings, downloads, and deployment logs"),
    bulletItem("Template validation engine that checks syntax and security of uploaded Jenkinsfiles, Terraform, and Helm charts"),
    bulletItem("Sandbox environment for testing templates before publishing (Minikube-based)"),
    bulletItem("Webhook integration for auto-deploying templates to target repositories"),
    bulletItem("Version management with semantic versioning and changelogs"),
    ...standardDevOpsSection(),
    heading3("Additional Tech Stack"),
    techStackTable([
      ["Template Validation", "Custom linters: Jenkinsfile (declarative-linter), Terraform (tflint, terraform validate), Helm (helm lint)"],
      ["Sandbox Execution", "Minikube + Kind for isolated template testing"],
      ["Object Storage", "MinIO (S3-compatible) for template artifact storage"],
      ["Search Engine", "Elasticsearch for full-text template search and faceted filtering"],
      ["Task Queue", "Celery + Redis for async validation, sandbox testing, and deployment jobs"],
      ["Git Integration", "PyGithub / GitLab API for webhook-based auto-deployment"],
      ["Template Registry", "OCI-compliant artifact registry (Harbor) for versioned templates"],
    ]),
    ...cicdPipelineStages(),
    heading2("API Endpoints"),
    heading3("Template Management"),
    codeEndpoint("GET", "/api/templates", "List/search templates with filters (type, category, rating, language)"),
    codeEndpoint("GET", "/api/templates/<template_id>", "Get template details, versions, and README"),
    codeEndpoint("POST", "/api/templates", "Publish a new template (file, type, description, tags)"),
    codeEndpoint("PUT", "/api/templates/<template_id>", "Update template metadata or publish new version"),
    codeEndpoint("DELETE", "/api/templates/<template_id>", "Unpublish a template"),
    codeEndpoint("GET", "/api/templates/<template_id>/versions", "List all versions of a template"),
    codeEndpoint("GET", "/api/templates/<template_id>/download", "Download a specific template version"),
    heading3("Validation & Testing"),
    codeEndpoint("POST", "/api/templates/<template_id>/validate", "Run syntax and security validation"),
    codeEndpoint("POST", "/api/templates/<template_id>/test", "Deploy template in sandbox and run tests"),
    codeEndpoint("GET", "/api/templates/<template_id>/test-results", "Get sandbox test results"),
    heading3("Deployment & Integration"),
    codeEndpoint("POST", "/api/templates/<template_id>/deploy", "Deploy template to target repo/cluster"),
    codeEndpoint("GET", "/api/deployments", "List all deployments triggered from marketplace"),
    codeEndpoint("GET", "/api/deployments/<deploy_id>/status", "Get deployment status and logs"),
    heading3("Community & Analytics"),
    codeEndpoint("POST", "/api/templates/<template_id>/reviews", "Submit a rating and review"),
    codeEndpoint("GET", "/api/templates/<template_id>/reviews", "Get all reviews for a template"),
    codeEndpoint("GET", "/api/analytics/trending", "Trending templates, most downloaded, top rated"),
    codeEndpoint("GET", "/api/analytics/usage", "Platform stats: total templates, downloads, deployments"),
    divider(),
  ];
}

// ─── DOCUMENT ASSEMBLY ───
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: COLORS.primary },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: COLORS.secondary },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: COLORS.dark },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
    ],
  },
  sections: [
    // ─── COVER PAGE ───
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: 2880, right: MARGIN, bottom: 1440, left: MARGIN },
        },
      },
      children: [
        spacer(600),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "DevOps Engineering", size: 56, bold: true, font: "Arial", color: COLORS.primary })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Final Project Catalog", size: 48, bold: true, font: "Arial", color: COLORS.secondary })],
        }),
        spacer(200),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Technion - Israel Institute of Technology", size: 28, font: "Arial", color: COLORS.dark })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "DevOps Course - 2026", size: 26, font: "Arial", color: COLORS.dark })],
        }),
        spacer(300),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "21 Full-Stack DevOps Projects", size: 30, bold: true, font: "Arial", color: COLORS.accent })],
        }),
        spacer(100),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.mediumGray } },
          spacing: { before: 200, after: 200 },
          children: [],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Required Stack: Docker | Kubernetes | Terraform | Jenkins | Prometheus | Grafana", size: 20, font: "Arial", color: "666666" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Flask | React | PostgreSQL | Helm | SonarQube | Trivy | ELK | GitLeaks | ArgoCD", size: 20, font: "Arial", color: "666666" })],
        }),
      ],
    },
    // ─── TABLE OF CONTENTS ───
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: 1440, right: MARGIN, bottom: 1440, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "DevOps Final Project Catalog - Technion 2026", size: 16, font: "Arial", color: "999999", italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 18, font: "Arial", color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: "999999" }),
            ],
          })],
        }),
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
          children: [new TextRun({ text: "Table of Contents", size: 36, bold: true, font: "Arial", color: COLORS.primary })],
        }),
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-1",
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ─── OVERVIEW ───
        heading1("Standardized DevOps Stack Overview"),
        bodyText("Every project in this catalog must be implemented using the following standardized DevOps technology stack. This ensures students gain hands-on experience with industry-standard tools and practices. Each project adds domain-specific technologies on top of this foundation."),
        spacer(80),
        techStackTable(STANDARD_DEVOPS_STACK),
        spacer(100),

        heading2("Mandatory Requirements for All Projects"),
        numberedItem("Containerize all application components using Docker with multi-stage builds"),
        numberedItem("Write Terraform modules for infrastructure provisioning (EKS, GKE, or Minikube)"),
        numberedItem("Deploy to Kubernetes with Helm Charts, ConfigMaps, Secrets, and Ingress"),
        numberedItem("Implement full CI/CD pipeline in Jenkins with lint, test, scan, build, deploy stages"),
        numberedItem("Set up Prometheus + Grafana monitoring with custom application metrics"),
        numberedItem("Configure security scanning: Trivy (containers), GitLeaks (secrets), SonarQube (SAST)"),
        numberedItem("Maintain separate Git repositories: App repo (code + Dockerfiles) and DevOps repo (IaC + K8s + CI/CD)"),
        numberedItem("Implement health checks (liveness/readiness probes) on all deployed services"),
        numberedItem("Set up log aggregation with ELK Stack or Loki"),
        numberedItem("Document architecture decisions, deployment steps, and runbooks"),
        spacer(80),

        heading2("Grading Criteria"),
        bulletItem("Application functionality: REST API completeness, error handling, data validation (25%)"),
        bulletItem("Containerization: Dockerfile quality, multi-stage builds, image optimization (15%)"),
        bulletItem("Kubernetes deployment: Manifests, Helm charts, probes, resource limits (20%)"),
        bulletItem("CI/CD pipeline: Pipeline completeness, security gates, automated testing (20%)"),
        bulletItem("Monitoring & observability: Prometheus metrics, Grafana dashboards, alerting (10%)"),
        bulletItem("Infrastructure as Code: Terraform modules, state management, reusability (10%)"),

        new Paragraph({ children: [new PageBreak()] }),

        // ─── PROJECTS ───
        ...project1(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project2(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project3(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project4(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project5(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project6(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project7(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project8(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project9(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project10(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project11(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project12(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project13(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project14(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project15(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project16(),
        new Paragraph({ children: [new PageBreak()] }),

        // ─── 5 NEW PROJECTS ───
        ...project17(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project18(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project19(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project20(),
        new Paragraph({ children: [new PageBreak()] }),
        ...project21(),
      ],
    },
  ],
});

// ─── GENERATE ───
Packer.toBuffer(doc).then(buffer => {
  const outPath = "/Users/hothaifa/workspace/devops-technion-3/projects/final project /DevOps_Final_Project_Catalog.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("Document generated: " + outPath);
  console.log("Size: " + (buffer.length / 1024).toFixed(1) + " KB");
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
