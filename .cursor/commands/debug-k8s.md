# /debug-k8s

Ask the agent to run a disciplined Kubernetes debugging loop with operational hygiene.

Include:
- Namespace and deployment names
- Symptoms (crashloop, readiness failing, rollout stuck)

Agent loop (Kubernetes best practices):
- Verify context/namespace; get events; describe pods; check recent logs
- Confirm config/secrets/env; validate image, resources, probes
- Inspect rollout history; diff manifests; apply minimal change; watch rollout
- Use `kubectl port-forward` or ephemeral debug pod if needed
- Collect evidence before/after; revert if regression; document findings

```bash
/debug-k8s prod backend-api "Readiness probe failing after deploy; check logs, events, and probes; iterate safely."
```