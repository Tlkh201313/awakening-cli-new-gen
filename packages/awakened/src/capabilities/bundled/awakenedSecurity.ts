import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const SECURITY_RE =
  /\b(security audit|security review|owasp|penetration test|pentest|vulnerability scan|threat model|security hardening|cve\b|xss\b|sql injection|auth bypass)\b/i

export const awakenedSecurityCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.security,
  displayName: "Awakened Security",
  description: "Security review playbook — threat model, read-only first",
  priority: 72,
  shouldActivate(ctx) {
    return SECURITY_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Security

Security-review playbook adapted for awakened agents (read-only first, then fixes with approval).

## Workflow

1. **Scope** — identify assets, trust boundaries, and attacker goals.
2. **Threat model** — STRIDE or OWASP Top 10 mapping; list high-risk flows (auth, input, secrets, deps).
3. **Read-only audit** — grep/read configs, deps, routes, and permission rules before changing code.
4. **Findings** — severity-tagged report with file:line evidence and concrete fixes.
5. **Remediate** — implement fixes only after user confirms; re-run targeted checks.

## How to work

- Invoke built-in Skill \`security-review\` for the full checklist.
- Use **security-auditor** or **penetration-tester** subagents for deep reviews.
- Do not run destructive exploits against production without explicit approval.

## References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Prefer dependency audit (\`npm audit\`, lockfile review) before custom scanner installs.
`
  },
}
