# Lab 1: Volumes, PV, PVC & StorageClass

## Objective

Persist data in Kubernetes using ephemeral volumes, static PVs and dynamic provisioning.

## Prerequisites

- Read [pv.md](../../materials/storage/pv.md), [pvc.md](../../materials/storage/pvc.md), [storageclass.md](../../materials/storage/storageclass.md)

## Exercise

### Step 1: emptyDir (shared between containers)
Create a pod with 2 containers:
- `writer` (busybox) appends the date to `/data/log.txt` every 2 seconds
- `reader` (busybox) runs `tail -f /data/log.txt`

Both mount an `emptyDir`. Check the logs of `reader`. Delete the pod - is the data kept?

### Step 2: Static provisioning
1. Create a `PersistentVolume` `pv-lab` of 1Gi, `hostPath: /mnt/pv-lab`, `ReadWriteOnce`, `persistentVolumeReclaimPolicy: Retain`, `storageClassName: manual`.
2. Create a PVC `pvc-lab` requesting 500Mi from the class `manual`.
3. What is the STATUS of both? What capacity does the PVC show and why?

### Step 3: Use the PVC
1. Deploy `nginx` mounting `pvc-lab` to `/usr/share/nginx/html`.
2. Write an `index.html` with `kubectl exec`.
3. Delete and recreate the deployment - is the page still there?

### Step 4: Reclaim policy
1. Delete the PVC. What is the PV status now?
2. Can a new PVC bind to it? How do you make it `Available` again?

### Step 5: Dynamic provisioning
1. List the StorageClasses. Which one is default?
2. Create a PVC without specifying a storageClassName. What PV got created automatically?
3. Delete the PVC - what happened to the PV (reclaim policy `Delete`)?

### Step 6: ConfigMap & Secret as volumes
Mount a ConfigMap with an `nginx.conf` and a Secret with a TLS key as files. Update the ConfigMap - is the file updated in the running pod? How long does it take?

## Challenge Exercise

1. Create your own StorageClass with `volumeBindingMode: WaitForFirstConsumer` and `allowVolumeExpansion: true`. Expand a PVC from 1Gi to 2Gi.
2. Explain `ReadWriteOnce` vs `ReadWriteMany` vs `ReadWriteOncePod`. Which AWS storage supports RWX?
3. Use `subPath` to mount a single file from a ConfigMap without hiding the rest of the directory.

## Deliverables
YAMLs + answers.
