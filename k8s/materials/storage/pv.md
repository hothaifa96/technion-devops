# PersistentVolume (PV)

## What is a PersistentVolume?

A PersistentVolume (PV) is a piece of storage in the cluster that has been provisioned by an administrator or dynamically using a StorageClass. It is a cluster-level resource independent of any Pod.

---

## Key Concepts

- Cluster-wide storage resource
- Lifecycle independent of Pods
- Can be provisioned statically (manual) or dynamically (StorageClass)
- Bound to a PersistentVolumeClaim (PVC)

---

## PV Access Modes

| Mode | Short | Description |
|------|-------|-------------|
| ReadWriteOnce | RWO | Mounted read-write by a single node |
| ReadOnlyMany | ROX | Mounted read-only by many nodes |
| ReadWriteMany | RWX | Mounted read-write by many nodes |

---

## Reclaim Policies

| Policy | Description |
|--------|-------------|
| Retain | Keep data after PVC is deleted (manual cleanup) |
| Delete | Delete the storage when PVC is deleted |
| Recycle | Basic scrub (rm -rf) — deprecated |

---

## PV Status

| Status | Description |
|--------|-------------|
| Available | Free, not bound to a PVC |
| Bound | Bound to a PVC |
| Released | PVC deleted, but resource not yet reclaimed |
| Failed | Automatic reclamation failed |

---

## Basic PV YAML (HostPath)

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /mnt/data
```

---

## PV with NFS

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv
spec:
  capacity:
    storage: 50Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  nfs:
    server: 192.168.1.100
    path: /exports/data
```

---

## PV with AWS EBS

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: aws-ebs-pv
spec:
  capacity:
    storage: 20Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  awsElasticBlockStore:
    volumeID: vol-0123456789abcdef0
    fsType: ext4
```

---

## Common kubectl Commands

```bash
kubectl apply -f pv.yaml
kubectl get pv
kubectl describe pv my-pv
kubectl delete pv my-pv
```

---
