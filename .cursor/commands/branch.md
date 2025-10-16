# /branch

Create a new local branch directly from a remote base branch (without checking out the base locally), set upstream, and optionally push.

- name (string, required): new branch name (e.g., `backend/fix-db-timeout`)
- base (string, optional): remote base branch (default: `main`)
- remote (string, optional): remote name (default: `origin`)
- push (boolean, optional): push and set upstream to `<remote>/<name>` (default: `true`)

Behavior:
- Fetch just the base ref and related metadata
- Create the branch from `<remote>/<base>` directly (no local checkout of `main`)
- Track `<remote>/<base>` and (optionally) push `name` to remote with upstream
- Abort if `name` already exists locally

Example:
```bash
/branch "frontend/feature-global-analysis-tabs" main origin true
```

Implementation outline (what this command does under the hood):
```bash
# 1) Fetch the base branch ref without switching
git fetch --prune origin refs/heads/main:refs/remotes/origin/main

# 2) Create new branch from the remote base directly (no local checkout of base)
#    Prefer modern switch; fallback to checkout if needed
if git switch -c "${NAME}" --track "${REMOTE}/${BASE}" 2>/dev/null; then
  :
else
  git checkout -b "${NAME}" "${REMOTE}/${BASE}"
fi

# 3) Optionally push the new branch and set upstream
[ "${PUSH:-true}" = "true" ] && git push -u "${REMOTE}" "${NAME}"
```

Notes:
- Recommended naming: `<role>/<concise-task-slug>` (e.g., `releng/workflow-audit-cleanup`)
- Use `/pr` or `/pr-ready` right after creating a branch if you plan to open a PR
- This flow avoids checking out `main` locally; it branches directly from the remote base
