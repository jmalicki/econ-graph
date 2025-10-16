# /k8s-logs

Tail logs for a deployment's pods (last 200 lines, follow). Tries labels `app=` and `app.kubernetes.io/name=`.

- deployment (string, required)
- namespace (string, optional)

```bash
/k8s-logs backend-api prod
```