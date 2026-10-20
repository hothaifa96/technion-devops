# Lab 1: Scheduling - Labels, Affinity, Taints & Tolerations

## Objective

Control **where** pods run.

## Prerequisites

- `minikube start --nodes 3 -p sched`
- Read [scheduling.md](../../materials/scheduling/scheduling.md)
- Reference: [class-code/lecture12-scheduling](../../class-code/lecture12-scheduling)

## Exercise

### Step 1: Labels
1. Label `sched-m02` with `zone=a, disktype=ssd` and `sched-m03` with `zone=b, disktype=hdd`.
2. Show nodes with their labels (`-L zone,disktype`).

### Step 2: nodeSelector
Run a pod that must land on an `ssd` node. Then a pod with `disktype=nvme` - what is its status and event?

### Step 3: Node affinity
1. Deployment with **required** affinity `zone In [a, b]` and **preferred** affinity `disktype=ssd` (weight 100), 6 replicas. Where did they land?

### Step 4: Pod anti-affinity
Deployment `web` with 4 replicas and **required** anti-affinity on `kubernetes.io/hostname`. How many are running? Change it to **preferred** - what changes?

### Step 5: Taints
1. Taint `sched-m03` with `team=data:NoSchedule`. Create a deployment with 6 replicas - does any land on m03?
2. Add a toleration - does it now **force** pods onto m03?
3. Make m03 **dedicated** to team data (taint + toleration + affinity).
4. Apply `NoExecute` on m02 - what happens to the running pods there?

### Step 6: Topology spread
Spread 6 replicas evenly across zones with `maxSkew: 1`.

## Challenge Exercise

1. Create a `PriorityClass` high-priority and show preemption of low-priority pods when the cluster is full.
2. Why does the control plane node not run your pods by default? Show the taint.

## Deliverables
YAMLs + `kubectl get pods -o wide` outputs.
