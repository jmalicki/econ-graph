# /k8s-deploy

Apply Kubernetes manifests from `k8s/manifests` (or a provided path).

- path (string, optional): manifests path (default: `k8s/manifests`)
- namespace (string, optional): target namespace

```bash
/k8s-deploy k8s/manifests prod
```