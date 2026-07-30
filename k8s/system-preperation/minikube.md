# Minikube Installation

## What is Minikube?

Minikube is a tool that runs a single-node Kubernetes cluster locally on your machine. It is ideal for learning, development, and testing.

---

## Prerequisites

- 2+ CPUs
- 2GB+ free memory
- 20GB+ free disk space
- Container or VM manager: Docker, VirtualBox, Hyper-V, or Podman

---

## Install on macOS

### Using Homebrew

```bash
brew install minikube
```

### Using curl (Intel)

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
sudo install minikube-darwin-amd64 /usr/local/bin/minikube
rm minikube-darwin-amd64
```

### Using curl (Apple Silicon)

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-arm64
sudo install minikube-darwin-arm64 /usr/local/bin/minikube
rm minikube-darwin-arm64
```

### Verify

```bash
minikube version
```

---

## Install on Linux

### Using curl

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64
```

### Using apt (Debian/Ubuntu)

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube_latest_amd64.deb
sudo dpkg -i minikube_latest_amd64.deb
rm minikube_latest_amd64.deb
```

### Using rpm (RHEL/CentOS)

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-latest.x86_64.rpm
sudo rpm -Uvh minikube-latest.x86_64.rpm
rm minikube-latest.x86_64.rpm
```

### Verify

```bash
minikube version
```

---

## Install on Windows

### Using Chocolatey

```powershell
choco install minikube
```

### Using Scoop

```powershell
scoop install minikube
```

### Manual Download

1. Download from: https://storage.googleapis.com/minikube/releases/latest/minikube-installer.exe
2. Run the installer
3. Add to PATH if not done automatically

### Verify

```powershell
minikube version
```

---

## Starting Minikube

### With Docker driver (recommended)

```bash
minikube start --driver=docker
```

### With VirtualBox driver

```bash
minikube start --driver=virtualbox
```

### With Hyper-V (Windows)

```powershell
minikube start --driver=hyperv
```

### Set default driver

```bash
minikube config set driver docker
```

---

## Custom Resources

```bash
minikube start --cpus=4 --memory=4096 --disk-size=40g
```

---

## Common Minikube Commands

```bash
# Status
minikube status

# Stop cluster
minikube stop

# Delete cluster
minikube delete

# SSH into node
minikube ssh

# Get cluster IP
minikube ip

# Open Kubernetes dashboard
minikube dashboard

# List addons
minikube addons list

# Enable addon
minikube addons enable ingress
minikube addons enable metrics-server

# Access a service
minikube service my-service --url
```

---

## Multi-Node Cluster

```bash
minikube start --nodes=3
```

---

## Using Local Docker Images

```bash
eval $(minikube docker-env)
docker build -t myapp:latest .
```

Then in your YAML use `imagePullPolicy: Never`:

```yaml
spec:
  containers:
    - name: app
      image: myapp:latest
      imagePullPolicy: Never
```

---

## Troubleshooting

```bash
# Check logs
minikube logs

# Delete and recreate
minikube delete
minikube start

# Check driver issues
minikube start --driver=docker --alsologtostderr
```

---
