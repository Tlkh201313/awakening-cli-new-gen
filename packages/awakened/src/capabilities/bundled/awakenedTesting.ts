import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const TESTING_RE =
  /\b(playwright|e2e\b|end[- ]?to[- ]?end|webapp[- ]?testing|integration test|browser test|ui test|puppeteer|selenium|cypress|vitest|jest\b|unit test|test suite|flaky test)\b/i

export const awakenedTestingCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.testing,
  displayName: "Awakened Testing",
  description: "Playwright, E2E, and webapp-testing playbooks",
  priority: 72,
  shouldActivate(ctx) {
    return TESTING_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Testing

Upstream: **@webapp-testing** and **playwright** skills from antigravity-awesome-skills; superpowers **test-driven-development**.

## Install

\`\`\`bash
npx antigravity-awesome-skills
# then invoke: Use @webapp-testing …
\`\`\`

Or Skill \`webapp-testing\` / \`testing\` (built-in).

## Workflow

1. **Reproduce** — minimal failing case before fixing flakes.
2. **E2E** — Playwright preferred; snapshot + wait for network idle on SPAs.
3. **Unit** — run from package dir (\`packages/foo\`), not repo root.
4. **Verify** — typecheck + targeted test file before full suite.

## Rules

- One test file per behavior change when possible.
- Do not mock implementation under test unless boundary is external I/O.
- Run tests from the owning package directory.

## Distinction

| Pack | Focus |
|------|-------|
| **Awakened Testing** | Playwright, E2E, unit/integration execution |
| **Awakened Superpowers** | TDD methodology before writing code |
| **Awakened Browser** | Manual browser automation for debugging sites |
`
  },
}
