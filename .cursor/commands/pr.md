# /pr

Create or update a GitHub Pull Request from the current branch using gh, with a templated body.

- title (string, required): PR title (short, descriptive)
- body (string, optional): PR body (markdown). If omitted, auto-generates from recent commits and diff
- base (string, optional): Base branch (default: main)
- draft (boolean, optional): Open as draft (default: false)

```bash
/pr "feat: add XYZ" "Summary and test plan" main true
```