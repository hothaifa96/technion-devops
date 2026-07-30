# Job and CronJob

## What is a Job?

A Job creates one or more Pods and ensures they run to completion. Unlike Deployments, Jobs are for tasks that should finish (batch processing, database migrations, etc.).

---

## Key Concepts

- Runs a task to completion
- Retries on failure
- Can run multiple Pods in parallel
- Pod is not restarted after successful completion

---

## Basic Job YAML

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: myapp:latest
          command: ["python", "manage.py", "migrate"]
      restartPolicy: Never
  backoffLimit: 4
```

---

## Job with Parallelism

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-job
spec:
  completions: 5
  parallelism: 2
  template:
    spec:
      containers:
        - name: worker
          image: busybox
          command: ["sh", "-c", "echo Processing item; sleep 5"]
      restartPolicy: Never
```

| Field | Description |
|-------|-------------|
| completions | Total number of successful completions needed |
| parallelism | Number of Pods running at the same time |
| backoffLimit | Number of retries before marking Job as failed |

---

## Job with TTL (Auto Cleanup)

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: cleanup-job
spec:
  ttlSecondsAfterFinished: 60
  template:
    spec:
      containers:
        - name: cleanup
          image: busybox
          command: ["sh", "-c", "echo Done"]
      restartPolicy: Never
```

---

## CronJob

A CronJob creates Jobs on a schedule (like cron in Linux).

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-backup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: mybackup:latest
              command: ["/bin/sh", "-c", "backup.sh"]
          restartPolicy: OnFailure
```

---

## CronJob Schedule Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

---

## CronJob Concurrency Policy

| Policy | Description |
|--------|-------------|
| Allow | Multiple Jobs can run concurrently (default) |
| Forbid | Skip new Job if previous is still running |
| Replace | Cancel running Job and start new one |

```yaml
spec:
  concurrencyPolicy: Forbid
```

---

## CronJob with History Limits

```yaml
spec:
  schedule: "*/5 * * * *"
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: task
              image: busybox
              command: ["echo", "hello"]
          restartPolicy: OnFailure
```

---

## Common kubectl Commands

```bash
# Jobs
kubectl apply -f job.yaml
kubectl get jobs
kubectl describe job db-migration
kubectl logs job/db-migration
kubectl delete job db-migration

# CronJobs
kubectl apply -f cronjob.yaml
kubectl get cronjobs
kubectl get cj
kubectl describe cj daily-backup
kubectl delete cj daily-backup
```

---
