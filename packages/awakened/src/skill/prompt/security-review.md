# Security Review Workflow

Security audit playbook for awakened agents — read-only first.

## When to use

Security audit, OWASP review, penetration testing prep, vulnerability assessment, or threat modeling.

## Workflow

1. **Scope** — define assets, data flows, and trust boundaries.
2. **Threat model** — map STRIDE or OWASP Top 10 to the codebase.
3. **Read-only pass** — review auth, input validation, secrets, deps, and permissions without edits.
4. **Findings** — report severity, file:line evidence, and recommended fixes.
5. **Remediate** — apply fixes only after user approval; re-verify targeted areas.

## Checklist

- Authentication and session handling
- Authorization and permission rules
- Input validation and output encoding (XSS, injection)
- Secrets in env, config, and logs
- Dependency vulnerabilities (`npm audit`, lockfile)
- Transport and cookie flags (HTTPS, SameSite, HttpOnly)

## Subagents

Use **security-auditor** or **penetration-tester** for deep reviews. Stay read-only until the user approves changes.

## Output format

One line per finding: `path:line: severity — problem. fix.`
