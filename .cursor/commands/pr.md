# /pr

Create or update a GitHub Pull Request from the current branch using gh, with a templated body, and enforce PR best practices.

- title (string, required): PR title (Conventional Commits)
- body (string, optional): PR body (markdown). If omitted, generate from recent commits + diff
- base (string, optional): Base branch (default: main)
- draft (boolean, optional): Open as draft (default: false)

```bash
/pr "feat(frontend): scope drawer queries with within() to fix flakiness" "See template below" main true
```

## Best practices (from personas/ standards)
- Conventional Commits for PR titles: feat|fix|docs|chore|refactor|perf|test|style|ci|build|revert(optional scope)
  - Examples: `feat(backend): add series search by tag`, `docs(personas): add Cursor slash commands [no ci]`
- Single concern PRs: split independent fixes/features into separate PRs
- Explain the why: focus on motivation and impact, not just diffs
- Tests are mandatory: add/update unit/integration/E2E tests; don’t bypass pre-commit
- Docs and config: update docs and workflows when behavior changes
- Security and migrations: call out secrets, auth, CORS, DB schema changes, and rollbacks
- CI etiquette: docs-only PRs use `[no ci]` in the title; watch checks before merging

## Body template
```md
## Summary
- <1–3 bullets explaining the change and its user impact>

## Motivation
- <Why this is needed; link issues/contexts>

## Changes
- <High-level list of significant changes>

## Test plan
- Unit: <commands / scope>
- Integration/E2E: <commands / scope>
- Screenshots/Recordings (if UI): <links>

## Risks & Rollback
- Risks: <perf, security, compatibility>
- Rollback plan: <how to revert safely>

## Migrations / Ops
- DB/GraphQL/schema changes: <details>
- K8s/Infra: <manifests, limits, probes>

## Links
- Closes #<id>
- Related: <links>
```

## Helper commands
- Create/ensure PR and view CI: `/pr-ready "feat(...): ..."`
- Watch PR checks: `/pr-checks`
- Show latest CI runs: `/ci-latest`
