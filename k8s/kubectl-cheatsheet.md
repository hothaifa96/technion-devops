# kubectl Cheatsheet

> Quick reference for the most-used `kubectl` commands.

---

## Syntax

```
kubectl [command] [TYPE] [NAME] [flags]
```

---

## Cluster & Context

```bash
kubectl version                          # client + server version
kubectl cluster-info                     # cluster endpoint info
kubectl config view                      # show full kubeconfig
kubectl config get-contexts              # list all contexts
kubectl config current-context           # show active context
kubectl config use-context <ctx>         # switch context
kubectl config set-context --current --namespace=<ns>   # set default namespace
kubectl config rename-context <old> <new>
kubectl config delete-context <ctx>
```

---

## Namespaces

```bash
kubectl get namespaces                   # alias: ns
kubectl create namespace <name>
kubectl delete namespace <name>
kubectl get all -n <name>                # all resources in a namespace
kubectl get all --all-namespaces         # all resources in every namespace  (alias: -A)
```

---

## Nodes

```bash
kubectl get nodes                        # list nodes
kubectl get nodes -o wide                # with IPs, OS, runtime
kubectl describe node <node>             # full node details
kubectl top node                         # CPU/memory (requires metrics-server)
kubectl cordon <node>                    # mark unschedulable
kubectl uncordon <node>                  # mark schedulable again
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data   # evict pods
kubectl taint nodes <node> key=value:NoSchedule
kubectl label nodes <node> disktype=ssd
```

---

## Pods

```bash
kubectl get pods                         # in current namespace
kubectl get pods -A                      # all namespaces
kubectl get pods -o wide                 # with node / IP
kubectl get pod <pod> -o yaml            # full YAML manifest
kubectl describe pod <pod>
kubectl logs <pod>                       # stdout
kubectl logs <pod> -c <container>        # specific container
kubectl logs <pod> -f                    # follow / tail
kubectl logs <pod> --previous           # crashed container logs
kubectl exec -it <pod> -- bash           # interactive shell
kubectl exec -it <pod> -c <c> -- sh      # specific container
kubectl port-forward pod/<pod> 8080:80   # local:container
kubectl delete pod <pod>
kubectl delete pod <pod> --grace-period=0 --force
kubectl run <pod> --image=nginx:alpine --restart=Never    # imperative pod
kubectl run <pod> --image=nginx --dry-run=client -o yaml  # generate YAML
```

---

## Deployments

```bash
kubectl get deployments
kubectl create deployment <name> --image=<image> --replicas=3
kubectl apply -f deployment.yaml
kubectl describe deployment <name>
kubectl rollout status deployment/<name>
kubectl rollout history deployment/<name>
kubectl rollout undo deployment/<name>                     # rollback one version
kubectl rollout undo deployment/<name> --to-revision=2
kubectl set image deployment/<name> <c>=<image>:<tag>     # rolling update
kubectl scale deployment/<name> --replicas=5
kubectl autoscale deployment/<name> --min=2 --max=10 --cpu-percent=50
kubectl delete deployment <name>

# Generate YAML without applying
kubectl create deployment <name> --image=nginx --dry-run=client -o yaml > deploy.yaml
```

---

## ReplicaSets / DaemonSets / StatefulSets / Jobs

```bash
kubectl get rs / ds / sts / jobs / cronjobs
kubectl describe rs <name>
kubectl delete rs <name>

kubectl create job <name> --image=busybox -- echo hello
kubectl create cronjob <name> --image=busybox --schedule="*/5 * * * *" -- echo hi
```

---

## Services

```bash
kubectl get services                     # alias: svc
kubectl get svc -o wide
kubectl describe svc <name>
kubectl expose deployment <name> --port=80 --target-port=8080 --type=ClusterIP
kubectl expose deployment <name> --port=80 --type=NodePort
kubectl expose deployment <name> --port=80 --type=LoadBalancer
kubectl delete svc <name>
kubectl port-forward svc/<name> 8080:80
```

---

## ConfigMaps & Secrets

```bash
# ConfigMaps
kubectl get configmaps                   # alias: cm
kubectl create configmap <name> --from-literal=KEY=VALUE
kubectl create configmap <name> --from-file=config.properties
kubectl describe cm <name>
kubectl edit cm <name>
kubectl delete cm <name>

# Secrets
kubectl get secrets
kubectl create secret generic <name> --from-literal=password=s3cr3t
kubectl create secret docker-registry regcred \
  --docker-server=<server> --docker-username=<u> \
  --docker-password=<p> --docker-email=<e>
kubectl get secret <name> -o jsonpath='{.data.password}' | base64 -d
kubectl delete secret <name>
```

---

## Persistent Volumes / Claims

```bash
kubectl get pv / pvc
kubectl describe pv <name>
kubectl describe pvc <name>
kubectl delete pvc <name>
```

---

## Ingress

```bash
kubectl get ingress                      # alias: ing
kubectl describe ingress <name>
kubectl delete ingress <name>
```

---

## RBAC

```bash
kubectl get roles / clusterroles
kubectl get rolebindings / clusterrolebindings
kubectl describe role <name> -n <ns>
kubectl auth can-i create pods --as=dev-user
kubectl auth can-i '*' '*'              # check if cluster-admin
```

---

## Apply / Delete

```bash
kubectl apply -f file.yaml
kubectl apply -f ./dir/                  # all yamls in directory
kubectl apply -f https://url/file.yaml
kubectl delete -f file.yaml
kubectl delete -f ./dir/
kubectl replace -f file.yaml            # destructive replace
kubectl diff -f file.yaml               # preview changes before apply
```

---

## Labels & Selectors

```bash
kubectl label pod <pod> env=prod
kubectl label pod <pod> env-                    # remove label
kubectl annotate pod <pod> description="test"
kubectl get pods -l env=prod
kubectl get pods -l 'env in (prod,staging)'
kubectl get pods --selector='app=nginx'
```

---

## Debugging & Troubleshooting

```bash
kubectl describe <TYPE> <name>           # events + spec details
kubectl events --namespace=<ns>          # recent events (k8s 1.26+)
kubectl get events --sort-by='.metadata.creationTimestamp'
kubectl top pod                          # CPU/mem (needs metrics-server)
kubectl top pod --containers             # per-container stats
kubectl debug -it <pod> --image=busybox --target=<c>  # ephemeral debug container (1.23+)
kubectl run debug --image=nicolaka/netshoot -it --rm  # network debug pod
kubectl cp <pod>:/path/to/file ./local   # copy files from pod
kubectl cp ./local <pod>:/path/to/file   # copy files to pod
```

---

## Output Formats

```bash
kubectl get pods -o wide
kubectl get pods -o yaml
kubectl get pods -o json
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase
kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.capacity.cpu
kubectl get pods --sort-by='.metadata.creationTimestamp'
```

---

## Imperative vs Declarative Quick Reference

| Action | Imperative | Declarative |
|--------|-----------|-------------|
| Create | `kubectl create ...` | `kubectl apply -f file.yaml` |
| Update | `kubectl set image ...` | `kubectl apply -f file.yaml` |
| Delete | `kubectl delete <TYPE> <name>` | `kubectl delete -f file.yaml` |
| Preview | `--dry-run=client -o yaml` | `kubectl diff -f file.yaml` |

---

## Useful Aliases (bash / zsh)

```bash
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgpa='kubectl get pods -A'
alias kgpw='kubectl get pods -o wide'
alias kgs='kubectl get svc'
alias kgd='kubectl get deployments'
alias kgn='kubectl get nodes'
alias kaf='kubectl apply -f'
alias kdf='kubectl delete -f'
alias kdp='kubectl describe pod'
alias kl='kubectl logs'
alias klf='kubectl logs -f'
alias kex='kubectl exec -it'
alias kns='kubectl config set-context --current --namespace'
```

Add to `~/.bashrc` or `~/.zshrc`, then `source` the file.

---

## Shell Autocompletion

```bash
# Bash
echo 'source <(kubectl completion bash)' >> ~/.bashrc && source ~/.bashrc

# Zsh
echo 'source <(kubectl completion zsh)' >> ~/.zshrc && source ~/.zshrc

# Fish
kubectl completion fish | source

# PowerShell
kubectl completion powershell | Out-String | Invoke-Expression
```

---

## Quick Cheat Card

| Goal | Command |
|------|---------|
| All pods all namespaces | `kubectl get pods -A` |
| Watch pods | `kubectl get pods -w` |
| Pod logs | `kubectl logs <pod> -f` |
| Shell into pod | `kubectl exec -it <pod> -- bash` |
| Forward port | `kubectl port-forward svc/<s> 8080:80` |
| Apply manifest | `kubectl apply -f file.yaml` |
| Rollback | `kubectl rollout undo deployment/<d>` |
| Scale | `kubectl scale deploy/<d> --replicas=3` |
| Switch ns | `kubectl config set-context --current --namespace=<ns>` |
| Switch context | `kubectl config use-context <ctx>` |
| Drain node | `kubectl drain <n> --ignore-daemonsets --delete-emptydir-data` |
| Generate YAML | `kubectl create deploy nginx --image=nginx --dry-run=client -o yaml` |
