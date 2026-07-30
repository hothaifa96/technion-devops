# Minikube Multi-Node Cheatsheet

> Running multi-node Kubernetes clusters locally with Minikube on macOS, Windows, and Linux.

---

## Prerequisites by Platform

| Requirement | macOS | Windows | Linux |
|-------------|-------|---------|-------|
| Min CPUs | 2 per node | 2 per node | 2 per node |
| Min RAM | 2 GB per node | 2 GB per node | 2 GB per node |
| Min Disk | 20 GB total | 20 GB total | 20 GB total |
| Recommended driver | Docker / HyperKit / QEMU | Docker / Hyper-V | Docker / KVM2 |

---

## Install Minikube

### macOS

```bash
# Homebrew (recommended)
brew install minikube

# Intel Mac (curl)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
sudo install minikube-darwin-amd64 /usr/local/bin/minikube && rm minikube-darwin-amd64

# Apple Silicon M1/M2/M3 (curl)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-arm64
sudo install minikube-darwin-arm64 /usr/local/bin/minikube && rm minikube-darwin-arm64
```

### Windows (PowerShell as Administrator)

```powershell
# Chocolatey
choco install minikube

# Scoop
scoop install minikube

# winget
winget install Kubernetes.minikube

# Manual exe installer
# Download: https://storage.googleapis.com/minikube/releases/latest/minikube-installer.exe
```

### Linux

```bash
# curl (amd64)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64

# apt (Debian/Ubuntu)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube_latest_amd64.deb
sudo dpkg -i minikube_latest_amd64.deb && rm minikube_latest_amd64.deb

# rpm (RHEL/CentOS/Fedora)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-latest.x86_64.rpm
sudo rpm -Uvh minikube-latest.x86_64.rpm && rm minikube-latest.x86_64.rpm
```

---

## Recommended Drivers per Platform

### macOS

```bash
# Docker (most portable, requires Docker Desktop)
minikube config set driver docker

# QEMU (native, no Docker needed — best for Apple Silicon)
brew install qemu
minikube config set driver qemu2

# HyperKit (Intel only)
brew install hyperkit
minikube config set driver hyperkit
```

### Windows

```powershell
# Docker (requires Docker Desktop with WSL2 backend)
minikube config set driver docker

# Hyper-V (requires Windows Pro/Enterprise — run as Admin)
minikube config set driver hyperv

# VirtualBox (free, works on Home edition)
minikube config set driver virtualbox
```

### Linux

```bash
# Docker
minikube config set driver docker

# KVM2 (bare-metal performance, recommended)
sudo apt install -y qemu-kvm libvirt-daemon-system
sudo usermod -aG libvirt $USER && newgrp libvirt
minikube config set driver kvm2

# VirtualBox
minikube config set driver virtualbox
```

---

## Start a Multi-Node Cluster

### Basic — 3 nodes (1 control-plane + 2 workers)

```bash
minikube start --nodes=3
```

### Full options

```bash
minikube start \
  --nodes=3 \
  --cpus=2 \
  --memory=2048 \
  --disk-size=20g \
  --driver=docker \
  --kubernetes-version=v1.30.0 \
  --profile=multi
```

| Flag | Default | Description |
|------|---------|-------------|
| `--nodes` | 1 | Total node count (control-plane + workers) |
| `--cpus` | 2 | CPUs per node |
| `--memory` | 2200mb | RAM per node |
| `--disk-size` | 20g | Disk per node |
| `--driver` | auto | Virtualization driver |
| `--kubernetes-version` | latest stable | K8s version |
| `--profile` / `-p` | minikube | Cluster profile name |
| `--container-runtime` | docker | docker / containerd / cri-o |

---

## Platform-Specific Start Examples

### macOS (Docker driver — Apple Silicon or Intel)

```bash
minikube start --nodes=3 --driver=docker --cpus=2 --memory=2048
```

### macOS (QEMU — native, no Docker Desktop)

```bash
minikube start --nodes=3 --driver=qemu2 --cpus=2 --memory=2048
```

### Windows (Docker Desktop + WSL2)

```powershell
minikube start --nodes=3 --driver=docker --cpus=2 --memory=2048
```

### Windows (Hyper-V — run PowerShell as Administrator)

```powershell
minikube start --nodes=3 --driver=hyperv --cpus=2 --memory=2048 --hyperv-virtual-switch="Default Switch"
```

### Linux (Docker)

```bash
minikube start --nodes=3 --driver=docker --cpus=2 --memory=2048
```

### Linux (KVM2 — best performance)

```bash
minikube start --nodes=3 --driver=kvm2 --cpus=2 --memory=2048
```

---

## Manage Nodes

```bash
# List nodes
kubectl get nodes
kubectl get nodes -o wide              # shows IPs, OS, container runtime

# Add a worker node to a running cluster
minikube node add

# Add with specific resources
minikube node add --cpus=2 --memory=2048

# Remove a node
minikube node delete <node-name>

# SSH into a specific node
minikube ssh -n minikube               # control-plane
minikube ssh -n minikube-m02           # first worker
minikube ssh -n minikube-m03           # second worker

# Get the IP of a specific node
minikube ip -n minikube-m02
```

> Node naming convention: control-plane = `minikube`, workers = `minikube-m02`, `minikube-m03`, ...

---

## Profiles (run multiple independent clusters)

```bash
# Start a named cluster
minikube start --nodes=3 --profile=dev
minikube start --nodes=2 --profile=staging

# List all profiles
minikube profile list

# Switch active profile
minikube profile dev

# Stop / delete a specific profile
minikube stop -p staging
minikube delete -p staging

# Delete ALL clusters
minikube delete --all
```

---

## Common Cluster Operations

```bash
# Status
minikube status
minikube status -p <profile>

# Stop cluster (preserves state)
minikube stop

# Start stopped cluster
minikube start

# Delete cluster (destroys everything)
minikube delete

# Pause / unpause (saves resources)
minikube pause
minikube unpause

# Dashboard
minikube dashboard
minikube dashboard --url              # print URL without opening browser
```

---

## Addons

```bash
# List all addons
minikube addons list

# Enable commonly needed addons
minikube addons enable ingress
minikube addons enable ingress-dns
minikube addons enable metrics-server
minikube addons enable dashboard
minikube addons enable registry
minikube addons enable storage-provisioner

# Disable an addon
minikube addons disable ingress
```

---

## Accessing Services

```bash
# Get URL for a NodePort service
minikube service <service-name> --url

# Open service in browser
minikube service <service-name>

# List all exposed services
minikube service list

# Port-forward alternative via kubectl
kubectl port-forward svc/<service-name> 8080:80
```

---

## Use Local Docker Images (no registry needed)

### macOS / Linux

```bash
# Point local Docker CLI at minikube's daemon
eval $(minikube docker-env)

# Build image directly into minikube
docker build -t myapp:latest .

# Undo — restore local Docker daemon
eval $(minikube docker-env -u)
```

### Windows (PowerShell)

```powershell
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
docker build -t myapp:latest .
```

> In your Pod/Deployment spec set `imagePullPolicy: Never` so Kubernetes uses the local image.

```yaml
spec:
  containers:
    - name: app
      image: myapp:latest
      imagePullPolicy: Never
```

---

## Load an Image from Local Docker into Minikube

```bash
# Preferred when NOT using docker-env
minikube image load myapp:latest

# List images inside minikube
minikube image list

# Build directly inside minikube
minikube image build -t myapp:latest .
```

---

## Tunnel — Expose LoadBalancer Services

```bash
# macOS / Linux (requires sudo for port 80/443)
minikube tunnel

# Windows (run PowerShell as Administrator)
minikube tunnel
```

Keep the terminal open; `EXTERNAL-IP` of LoadBalancer services will be assigned to `127.0.0.1`.

---

## Resource Management

```bash
# Start with more resources
minikube start --nodes=3 --cpus=4 --memory=4096 --disk-size=50g

# Check resource usage
kubectl top nodes
kubectl top pods -A
```

---

## Logs & Troubleshooting

```bash
# Cluster logs
minikube logs
minikube logs -n minikube-m02          # logs for a specific node
minikube logs --file=minikube.log      # save logs to file

# Verbose start (debug driver issues)
minikube start --nodes=3 --alsologtostderr -v=4

# Check driver requirements
minikube start --nodes=3 --driver=docker --dry-run

# Fix "Exiting due to PROVIDER_DOCKER_NOT_RUNNING"
# → Start Docker Desktop (macOS / Windows) or: sudo systemctl start docker (Linux)

# Fix "Insufficient memory" on Docker Desktop (macOS / Windows)
# → Docker Desktop → Settings → Resources → increase Memory

# Fix Hyper-V "switch not found" (Windows)
minikube start --driver=hyperv --hyperv-virtual-switch="Default Switch"

# Reset a broken cluster
minikube delete && minikube start --nodes=3

# Check node readiness
kubectl get nodes
kubectl describe node minikube-m02
```

---

## Quick Reference — Node Workflow

```bash
# 1. Start 3-node cluster
minikube start --nodes=3 --cpus=2 --memory=2048

# 2. Verify
kubectl get nodes -o wide

# 3. Taint control-plane so workloads land on workers only
kubectl taint nodes minikube node-role.kubernetes.io/control-plane:NoSchedule

# 4. Deploy a workload
kubectl create deployment nginx --image=nginx --replicas=2

# 5. Check pods spread across workers
kubectl get pods -o wide

# 6. Add another worker
minikube node add

# 7. Remove a worker
minikube node delete minikube-m03

# 8. Stop cluster
minikube stop

# 9. Clean up
minikube delete
```

---

## Platform Comparison Table

| Feature | macOS | Windows | Linux |
|---------|-------|---------|-------|
| Recommended driver | `docker` / `qemu2` | `docker` / `hyperv` | `docker` / `kvm2` |
| Multi-node support | ✅ | ✅ | ✅ |
| `minikube tunnel` needs sudo | ✅ | ❌ (Admin prompt) | ✅ |
| `eval $(minikube docker-env)` | ✅ bash/zsh | ❌ use PowerShell snippet | ✅ |
| Best performance driver | `qemu2` (Apple Silicon) | `hyperv` | `kvm2` |
| LoadBalancer support | via `tunnel` | via `tunnel` | via `tunnel` |
