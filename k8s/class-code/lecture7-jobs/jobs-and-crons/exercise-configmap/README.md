# Exercise - Run a Job from a script stored in a ConfigMap

Building an image every time a script changes is slow. Here you put the script in a
**ConfigMap**, mount it as a file into an **official** image, and run it as a Job.

## Tasks

1. **Create the ConfigMap from files** (imperative):
   ```bash
   kubectl create configmap job-scripts \
     --from-file=app.py=../python/app.py \
     --from-file=app.js=../javascript/app.js \
     --from-file=app.sh=../bash/app.sh
   kubectl describe cm job-scripts
   ```
   Then export it to YAML: `kubectl get cm job-scripts -o yaml > my-configmap.yml`

2. **Python Job** - write `cm-python-job`:
   - image `python:3.12-slim`
   - mount the ConfigMap at `/scripts`
   - `requests` is not in the image - install it in the `command` before running the script
   - set env `USER_ID=4`

3. **JavaScript Job** - write `cm-javascript-job`:
   - image `node:20-alpine`
   - mount **only** `app.js` (hint: `volumes.configMap.items`)

4. **Bash Job** - write `cm-bash-job`:
   - the script needs `bash`, `curl` and `jq`. Pick an image or install them in `command`
     (hint: `alpine:3.20` + `apk add --no-cache bash curl jq`)
   - run the script **directly** (`/scripts/app.sh`), not via `bash /scripts/app.sh`
     (hint: `defaultMode`)

5. **Change the script without rebuilding**:
   - edit the ConfigMap (`kubectl edit cm job-scripts`) - e.g. change the output text
   - Jobs are immutable: `kubectl delete job cm-python-job && kubectl apply -f ...`
   - check the logs show the new output

6. **Bonus**:
   - turn `cm-python-job` into a CronJob that runs every 2 minutes
   - make it run 5 times, 2 in parallel, each with a different `USER_ID`
     (hint: `completionMode: Indexed` + `JOB_COMPLETION_INDEX`)

## Check

```bash
kubectl get jobs
kubectl logs job/cm-python-job
kubectl logs job/cm-javascript-job
kubectl logs job/cm-bash-job
kubectl exec -it <pod> -- ls -l /scripts      # (only while the pod is running)
```

## Solution

`solution/configmap.yml` + `solution/jobs.yml` (the solution bash script uses only
`curl` + `grep` so it runs on `curlimages/curl` without installing anything).

```bash
kubectl apply -f solution/
kubectl logs -f job/cm-python-job
kubectl delete -f solution/
```
