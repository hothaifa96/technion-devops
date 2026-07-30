# kubectl Installation

## What is kubectl?

`kubectl` is the command-line tool for interacting with Kubernetes clusters. It communicates with the Kubernetes API server to manage resources.

---

## Install on macOS

### Using Homebrew

```bash
brew install kubectl
```

### Using curl

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

### Apple Silicon (M1/M2/M3)

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/arm64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

### Verify

```bash
kubectl version --client
```

---

## Install on Linux

### Using curl

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

### Using apt (Debian/Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl

curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubectl
```

### Using yum (RHEL/CentOS)

```bash
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://pkgs.k8s.io/core:/stable:/v1.30/rpm/
enabled=1
gpgcheck=1
gpgkey=https://pkgs.k8s.io/core:/stable:/v1.30/rpm/repodata/repomd.xml.key
EOF

sudo yum install -y kubectl
```

### Verify

```bash
kubectl version --client
```

---

## Install on Windows

### Using Chocolatey

```powershell
choco install kubernetes-cli
```

### Using Scoop

```powershell
scoop install kubectl
```

### Using curl (PowerShell)

```powershell
curl.exe -LO "https://dl.k8s.io/release/v1.30.0/bin/windows/amd64/kubectl.exe"
```

Move `kubectl.exe` to a directory in your PATH (e.g., `C:\kubectl\`).

Add to PATH:

```powershell
$env:PATH += ";C:\kubectl"
```

### Verify

```powershell
kubectl version --client
```

---

## Configuration

kubectl looks for config at `~/.kube/config`.

```bash
# View current config
kubectl config view

# List contexts
kubectl config get-contexts

# Switch context
kubectl config use-context my-cluster

# Set default namespace
kubectl config set-context --current --namespace=dev
```

---

## Enable Shell Autocompletion

### Bash

```bash
echo 'source <(kubectl completion bash)' >> ~/.bashrc
source ~/.bashrc
```

### Zsh

```bash
echo 'source <(kubectl completion zsh)' >> ~/.zshrc
source ~/.zshrc
```

### PowerShell

```powershell
kubectl completion powershell | Out-String | Invoke-Expression
```

---

## Useful Aliases

```bash
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get svc'
alias kgd='kubectl get deployments'
alias kaf='kubectl apply -f'
alias kdel='kubectl delete -f'
```

---
