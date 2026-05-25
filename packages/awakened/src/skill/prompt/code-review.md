# Code Review

Structured PR and diff review for awakened agents.

## Process

1. Read the full diff — understand intent before nitpicking.
2. Check correctness, scope, tests, security, and style match.
3. Output one line per finding: `path:line: severity: problem. fix.`

## Severity

- **blocker** — must fix before merge
- **major** — likely bug or serious maintainability issue
- **minor** — should fix, not blocking
- **nit** — optional polish

## Rules

- No praise padding — actionable signal only.
- Do not rewrite the PR; review what was submitted.
- Escalate to Skill `security-review` for auth/crypto/secrets diffs.
