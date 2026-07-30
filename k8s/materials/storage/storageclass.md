# StorageClass

## What is a StorageClass?

A StorageClass provides a way to describe different "classes" of storage. It enables dynamic provisioning of PersistentVolumes — when a PVC requests storage, Kubernetes automatically creates a PV using the StorageClass.

---

## Key Concepts

- Defines how storage is provisioned dynamically
- Eliminates the need to manually create PVs
- Different classes for different performance tiers (SSD, HDD, etc.)
- Each cloud provider has its own provisioners

---

## How Dynamic Provisioning Works

1. Admin creates a StorageClass
2. User creates a PVC referencing the StorageClass
3. Kubernetes automatically provisions a PV
4. PVC is bound to the new PV

---

## Basic StorageClass YAML

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
```

---

## AWS EBS StorageClass

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: aws-gp3
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

---

## GCP PD StorageClass

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gcp-ssd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

---

## Azure Disk StorageClass

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: azure-premium
provisioner: disk.csi.azure.com
parameters:
  skuName: Premium_LRS
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

---

## Volume Binding Modes

| Mode | Description |
|------|-------------|
| Immediate | PV provisioned as soon as PVC is created |
| WaitForFirstConsumer | PV provisioned when a Pod using the PVC is scheduled |

---

## Reclaim Policies

| Policy | Description |
|--------|-------------|
| Delete | PV and underlying storage deleted when PVC is deleted |
| Retain | PV kept after PVC is deleted (manual cleanup) |

---

## Set Default StorageClass

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
```

---

## Using StorageClass in a PVC

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: aws-gp3
  resources:
    requests:
      storage: 20Gi
```

---

## Common kubectl Commands

```bash
kubectl get storageclass
kubectl get sc
kubectl describe sc standard
kubectl delete sc my-storageclass
```

---
