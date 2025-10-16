# /pr

Create or update a GitHub Pull Request from the current branch using gh, with a templated body.

- title (string, required): PR title (short, descriptive)
- body (string, optional): PR body (markdown). If omitted, auto-generates from recent commits and diff
- base (string, optional): Base branch (default: main)
- draft (boolean, optional): Open as draft (default: false)

```bash
/pr "feat: add XYZ" "Summary and test plan" main true
```

---

# /commit

Create a conventional commit with a multi-line message via heredoc and show status.

- message (string, required): Commit message (first line + optional details)

```bash
/commit "docs: update Cursor-native commands [no ci]"
```

---

# /review

Summarize current diff and highlight risks, test gaps, and CI considerations.

```bash
/review
```

---

# /e2e

Run end-to-end integration tests via `scripts/test-e2e.sh`.

- suite (string, optional): one of `all|backend|frontend|combined` (default: `all`)

```bash
/e2e combined
```

---

# /ci-latest

Show latest GitHub Actions runs for the current branch and their statuses.

```bash
/ci-latest
```

---

# /pr-ready

Push current branch and ensure it has an open PR; print PR URL and CI runs.

- title (string, optional): PR title if a PR needs creating

```bash
/pr-ready "feat: integration hardening"
```

---

# /pr-checks

Watch PR checks for the current branch.

```bash
/pr-checks
```

---

# /k8s-context

Show current kubectl context and available namespaces.

```bash
/k8s-context
```

---

# /k8s-deploy

Apply Kubernetes manifests from `k8s/manifests` (or a provided path).

- path (string, optional): manifests path (default: `k8s/manifests`)
- namespace (string, optional): target namespace

```bash
/k8s-deploy k8s/manifests prod
```

---

# /k8s-restart

Restart a Kubernetes deployment and wait for rollout.

- deployment (string, required): deployment name
- namespace (string, optional): target namespace

```bash
/k8s-restart backend-api prod
```

---

# /k8s-logs

Tail logs for a deployment's pods (last 200 lines, follow). Tries labels `app=` and `app.kubernetes.io/name=`.

- deployment (string, required)
- namespace (string, optional)

```bash
/k8s-logs backend-api prod
```

---

# /db-migrate

Run Diesel database migrations in `backend/` against `DATABASE_URL`.

- database_url (string, optional): override `DATABASE_URL`

```bash
/db-migrate postgres://user:pass@host:5432/db
```

---

# /docker-logs

Tail logs for a local Docker container (last 200 lines, follow).

- name (string, required): container name or ID

```bash
/docker-logs econ-graph-test-postgres
```

---

# /workflow-audit

Audit `.github/workflows` for common issues: missing triggers, empty steps, missing names.

```bash
/workflow-audit
```

---

# /deploy

Run repo deploy script if available (`scripts/deploy/deploy.sh`).

```bash
/deploy
```
