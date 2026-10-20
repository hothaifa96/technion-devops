# Lecture 10 - Security: RBAC, ServiceAccounts, securityContext, PSA, Secrets

```bash
# --- RBAC + ServiceAccount ---
kubectl apply -f rbac.yml
kubectl -n security-demo exec kubectl -- kubectl get pods            # allowed
kubectl -n security-demo exec kubectl -- kubectl delete pod kubectl  # Forbidden
kubectl -n security-demo exec kubectl -- kubectl get secrets         # Forbidden
kubectl auth can-i --list -n security-demo --as=system:serviceaccount:security-demo:viewer
kubectl -n security-demo exec kubectl -- cat /var/run/secrets/kubernetes.io/serviceaccount/token | cut -c1-50

# --- why privileged is dangerous ---
kubectl apply -f insecure-pod.yml
kubectl -n security-demo exec -it insecure -- chroot /host sh   # root on the node!
kubectl -n security-demo exec insecure -- ps aux | head         # sees host processes

# --- Pod Security Admission ---
kubectl apply -f restricted-ns.yml
kubectl -n restricted-ns run bad --image=nginx                  # rejected (violations listed)
kubectl apply -f secure-pod.yml                                 # accepted
kubectl -n restricted-ns exec secure -- id
kubectl -n restricted-ns exec secure -- touch /etc/x            # Read-only file system

# --- Secrets are only base64! ---
kubectl -n security-demo create secret generic db --from-literal=password=S3cr3t
kubectl -n security-demo get secret db -o jsonpath='{.data.password}' | base64 -d
# -> protect with RBAC, encryption at rest, External Secrets / Sealed Secrets / Vault

kubectl delete ns security-demo restricted-ns
```
