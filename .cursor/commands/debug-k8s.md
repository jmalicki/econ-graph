# /debug-k8s

Ask the agent to run a disciplined Kubernetes debugging loop with operational hygiene.

Include:
- Namespace and deployment names
- Symptoms (crashloop, readiness failing, rollout stuck)

Agent loop (Kubernetes best practices):
- Verify context/namespace; list all relevant components to build a full picture:
  - Deployments, StatefulSets, DaemonSets, Jobs/CronJobs
  - Services, Ingress/IngressClass, Endpoints/EndpointSlices
  - ConfigMaps, Secrets, HPAs, PDBs, NetworkPolicies
  - List pods with owner refs to map components → pods
- For each component/pod, gather targeted evidence before hypothesizing:
  - `kubectl describe` for events, conditions, probe failures
  - Container logs per pod and per container (last N lines, and since-restarts)
  - Replicas vs available, restart counts, image tags/digests, resources/limits
  - Probe configs (readiness/liveness/startup) and recent failures
- Bisect the path to isolate the failing layer before forming a hypothesis:
  - Ingress → Service → Endpoints/Pods → Application → External deps (DB, APIs)
  - Port-forward to probe health/ready endpoints directly; `kubectl exec` to run curl/env checks in-pod
  - Confirm service selectors match pod labels; confirm endpoints are populated
- Only after isolating the failing component, form ONE clear hypothesis
- Make ONE targeted change (small manifest tweak, config fix, rollout restart), apply, and watch rollout to completion
- Collect before/after evidence; if unresolved, revert or iterate with a new focused hypothesis; document findings

```bash
/debug-k8s prod backend-api "Readiness probe failing after deploy; check logs, events, and probes; iterate safely."
```