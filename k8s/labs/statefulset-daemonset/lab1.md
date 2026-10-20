# Lab 1: StatefulSet & DaemonSet

## Objective

Run stateful applications with stable identity and storage, and node-level agents with DaemonSets.

## Prerequisites

- Read [statefulset.md](../../materials/workloads/statefulset.md) and [daemonset.md](../../materials/workloads/daemonset.md)
- 2-node minikube

## Part A - MongoDB StatefulSet

1. Create a headless Service `mongo` (port 27017).
2. Create a StatefulSet `mongo` with 3 replicas, image `mongo:7`, args `["--replSet", "rs0", "--bind_ip_all"]`, and `volumeClaimTemplates` of 200Mi.
3. Watch the pods being created. In which order? Why?
4. Initialise the replica set:
   ```bash
   kubectl exec -it mongo-0 -- mongosh --eval 'rs.initiate({_id:"rs0",members:[
     {_id:0,host:"mongo-0.mongo:27017"},{_id:1,host:"mongo-1.mongo:27017"},{_id:2,host:"mongo-2.mongo:27017"}]})'
   ```
5. Insert a document on the primary and read it from a secondary.
6. Delete `mongo-1`. Does it come back with the same name, DNS and PVC?
7. Scale to 1 replica - are the PVCs deleted?

## Part B - DaemonSet

1. Write a DaemonSet `node-exporter` using `prom/node-exporter` with `hostNetwork: true` and `hostPID: true`, port 9100.
2. Verify one pod per node. `curl <nodeIP>:9100/metrics | head`.
3. Add a toleration so it also runs on the control plane node.
4. Add a nodeSelector `monitoring=true` - what happens? Label one node and observe.
5. Do a rolling update (change the image tag) - what is the default update strategy?

## Challenge Exercise

1. Compare Deployment vs StatefulSet vs DaemonSet in a table: identity, storage, scaling order, use cases.
2. Use `podManagementPolicy: Parallel` - what changes?
3. Use `updateStrategy.rollingUpdate.partition: 2` for a canary update of only `mongo-2`.

## Deliverables
YAMLs + answers + table.
