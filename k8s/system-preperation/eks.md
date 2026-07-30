# Amazon EKS Setup

## What is EKS?

Amazon Elastic Kubernetes Service (EKS) is a managed Kubernetes service by AWS. It runs the Kubernetes control plane for you, so you only manage the worker nodes.

---

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- kubectl installed
- eksctl installed (recommended)

---

## Install AWS CLI

### macOS

```bash
brew install awscli
```

Or:

```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
rm AWSCLIV2.pkg
```

### Linux

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip
```

### Windows

Download and run: https://awscli.amazonaws.com/AWSCLIV2.msi

Or using Chocolatey:

```powershell
choco install awscli
```

### Configure AWS CLI

```bash
aws configure
```

Enter:

- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Output format (json)

### Verify

```bash
aws sts get-caller-identity
```

---

## Install eksctl

### macOS

```bash
brew tap weaveworks/tap
brew install weaveworks/tap/eksctl
```

### Linux

```bash
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

### Windows

```powershell
choco install eksctl
```

### Verify

```bash
eksctl version
```

---

## Create an EKS Cluster

### Using eksctl (simplest)

```bash
eksctl create cluster \
  --name my-cluster \
  --region us-east-1 \
  --nodegroup-name workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed
```

This takes 15-20 minutes.

### Using eksctl with config file

Create `cluster.yaml`:

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: my-cluster
  region: us-east-1
  version: "1.29"

managedNodeGroups:
  - name: workers
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 1
    maxSize: 4
    volumeSize: 30
    ssh:
      allow: true
      publicKeyName: my-key
```

Apply:

```bash
eksctl create cluster -f cluster.yaml
```

---

## Connect kubectl to EKS

```bash
aws eks update-kubeconfig --region us-east-1 --name my-cluster
```

### Verify

```bash
kubectl get nodes
kubectl get pods -A
```

---

## Scale Node Group

```bash
eksctl scale nodegroup --cluster=my-cluster --name=workers --nodes=4 --nodes-min=2 --nodes-max=6
```

---

## Delete Cluster

```bash
eksctl delete cluster --name my-cluster --region us-east-1
```

---

## EKS with Fargate (Serverless)

```bash
eksctl create cluster \
  --name fargate-cluster \
  --region us-east-1 \
  --fargate
```

---

## Install EBS CSI Driver (for PersistentVolumes)

```bash
eksctl create addon --name aws-ebs-csi-driver --cluster my-cluster --region us-east-1
```

---

## Install AWS Load Balancer Controller

```bash
# Create IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.6.0/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

# Install via Helm
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=my-cluster
```

---

## Common Commands

```bash
# List clusters
eksctl get cluster

# Get nodegroups
eksctl get nodegroup --cluster my-cluster

# Check cluster info
kubectl cluster-info

# View nodes
kubectl get nodes -o wide
```

---

## Cost Considerations

- EKS control plane: ~$0.10/hour (~$73/month)
- Worker nodes: EC2 pricing based on instance type
- Fargate: pay per vCPU and memory per second

> **Tip:** Always delete your cluster when not in use for learning to avoid charges.

---
