# K3s Installation

## What is K3s?

K3s is a lightweight, certified Kubernetes distribution built for production. It is designed for resource-constrained environments, edge computing, IoT, and CI/CD pipelines. It packages Kubernetes into a single binary under 100MB.

---

## Key Features

- Single binary (~70MB)
- Low memory footprint (~512MB RAM)
- Embedded SQLite (no etcd needed for single node)
- Built-in: Traefik ingress, CoreDNS, Flannel CNI, local-path storage
- Production-ready

---

## Prerequisites

- Linux OS (Ubuntu, Debian, CentOS, RHEL, etc.)
- 512MB RAM minimum (1GB+ recommended)
- 1 CPU minimum

> **Note:** K3s is designed for Linux. For Mac and Windows, use Multipass or a VM to run a Linux instance, then install K3s inside it.

---

## Install on Linux (Server/Master)

### One-line install

```bash
curl -sfL https://get.k3s.io | sh -
```

### Verify

```bash
sudo k3s kubectl get nodes
```

### Check service status

```bash
sudo systemctl status k3s
```

### Get kubeconfig

```bash
sudo cat /etc/rancher/k3s/k3s.yaml
```

### Use kubectl without sudo

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
export KUBECONFIG=~/.kube/config
```

---

## Install Worker Node (Agent)

On the master, get the token:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

On the worker node:

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://<MASTER_IP>:6443 K3S_TOKEN=<NODE_TOKEN> sh -
```

### Verify from master

```bash
kubectl get nodes
```

---

## Install on macOS (via Multipass)

### Install Multipass

```bash
brew install multipass
```

### Create a VM and install K3s

```bash
multipass launch --name k3s-master --cpus 2 --memory 2G --disk 10G
multipass exec k3s-master -- bash -c "curl -sfL https://get.k3s.io | sh -"
```

### Get kubeconfig

```bash
multipass exec k3s-master -- sudo cat /etc/rancher/k3s/k3s.yaml > ~/.kube/k3s-config
```

Edit the file and replace `127.0.0.1` with the VM IP:

```bash
multipass info k3s-master | grep IPv4
```

```bash
export KUBECONFIG=~/.kube/k3s-config
kubectl get nodes
```

---

## Install on Windows (via Multipass)

### Install Multipass

Download from: https://multipass.run/download/windows

Or use Chocolatey:

```powershell
choco install multipass
```

### Create a VM and install K3s

```powershell
multipass launch --name k3s-master --cpus 2 --memory 2G --disk 10G
multipass exec k3s-master -- bash -c "curl -sfL https://get.k3s.io | sh -"
```

### Get kubeconfig

```powershell
multipass exec k3s-master -- sudo cat /etc/rancher/k3s/k3s.yaml > $env:USERPROFILE\.kube\k3s-config
```

Replace `127.0.0.1` with VM IP in the config file:

```powershell
multipass info k3s-master
```

Set KUBECONFIG:

```powershell
$env:KUBECONFIG = "$env:USERPROFILE\.kube\k3s-config"
kubectl get nodes
```

---

## K3s Install Options

```bash
# Disable Traefik (use your own ingress)
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -

# Disable ServiceLB
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable servicelb" sh -

# Custom cluster CIDR
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--cluster-cidr=10.42.0.0/16 --service-cidr=10.43.0.0/16" sh -

# Specific version
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.29.0+k3s1" sh -
```

---

## Uninstall K3s

### Server

```bash
/usr/local/bin/k3s-uninstall.sh
```

### Agent

```bash
/usr/local/bin/k3s-agent-uninstall.sh
```

---

## Common Commands

```bash
# Check cluster
kubectl get nodes
kubectl get pods -A

# K3s service
sudo systemctl start k3s
sudo systemctl stop k3s
sudo systemctl restart k3s

# Logs
sudo journalctl -u k3s -f
```

---
