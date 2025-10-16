# /commit

Create a Conventional Commit and show a concise status summary.

- message (string, required): Use Conventional Commits: `type(scope): summary`
  - Types: `feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert`
  - Examples: `feat(backend): add series search by tag`, `docs(personas): add Cursor slash commands [no ci]`

```bash
/commit "fix(frontend): scope drawer queries to prevent duplicate element errors"
```

Before committing (strongly recommended):
- Frontend formatting/lint (auto-fix):
  - `cd frontend && npm run prettier-fix && npm run lint:fix && npm run typecheck`
- Frontend tests (targeted to changed areas):
  - `npm run test:unit` or specific files with vitest
- Backend formatting/lints:
  - `cd backend && cargo fmt --all && cargo clippy --all-targets --all-features -- -D warnings`
- Backend tests (targeted):
  - `cargo test -p <crate> <module_or_test_name>`

Pre-commit reminder:
- Install once: `pre-commit install`
- Run locally for changed files: `pre-commit run`
- Run across repo: `pre-commit run --all-files`

Notes:
- Docs-only commits should include `[no ci]` in the subject when appropriate
- If hooks fail, fix the underlying issues; do not bypass with `--no-verify`
