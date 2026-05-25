import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const REVIEW_RE =
  /\b(code review|review (?:this )?pr|pull request review|review my diff|review the changes|pre[- ]?merge review|ship checklist|reviewer agent|cavecrew[- ]?reviewer)\b/i

export const awakenedCodeReviewCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.codereview,
  displayName: "Awakened Code Review",
  description: "PR and diff review playbook",
  priority: 70,
  shouldActivate(ctx) {
    return REVIEW_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Code Review

Invoke Skill \`code-review\` or spawn subagent **cavecrew-reviewer** / **reviewer**.

## Checklist

1. **Correctness** — does the change match intent? edge cases?
2. **Scope** — minimal diff? unrelated churn?
3. **Tests** — behavior covered? assertions meaningful?
4. **Security** — injection, auth, secrets, unsafe defaults?
5. **Style** — matches surrounding code; no drive-by refactors.

## Output format

One line per finding: \`path:line: severity: problem. fix.\`

Severity: blocker | major | minor | nit.

## Rules

- Read the diff first; do not re-implement from scratch.
- Praise only when it saves a real bug — focus on actionable issues.
- If no issues: say "No blocking issues" and note residual risks briefly.

## Related

- Skill \`security-review\` for security-heavy diffs.
- Built-in \`/review\` command when available in session.
`
  },
}
