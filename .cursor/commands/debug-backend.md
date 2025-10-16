# /debug-backend

Ask the agent to run a disciplined backend debugging loop aligned with our best practices.

Include:
- Linked failing test(s), error logs, or file(s)
- Expected vs actual behavior

Agent loop (backend best practices):
- Identify a single failing scenario and capture the exact error message
- Reproduce locally with the exact failing test/command
- Form a hypothesis and make ONE targeted change
- Re-run the same scenario; collect evidence (logs, diffs)
- If fixed, write/strengthen tests; else iterate with a new hypothesis
- Never bypass pre-commit; never claim success without proof

```bash
/debug-backend @backend/src/graphql/financial_query.rs "Timeout on /graphql: health OK, queries hang. Reproduce and iterate with single-change loops."
```