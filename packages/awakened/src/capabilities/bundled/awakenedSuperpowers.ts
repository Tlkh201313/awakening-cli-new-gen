import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const SUPERPOWERS_RE =
  /\b(superpowers|test[- ]?driven|tdd\b|test[- ]?first|red[- ]?green[- ]?refactor|brainstorm before (?:build|implement)|write (?:the )?test first|obra\/superpowers)\b/i

export const awakenedSuperpowersCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.superpowers,
  displayName: "Awakened Superpowers",
  description: "Obra superpowers workflow — brainstorm, plan, TDD, verify",
  priority: 75,
  shouldActivate(ctx) {
    return SUPERPOWERS_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Superpowers

Upstream: **obra/superpowers** plugin — agentic skills methodology (brainstorm → plan → implement → verify).

## Install

\`\`\`bash
/plugin marketplace add obra/superpowers
\`\`\`

Or install via Claude Code plugin marketplace: **obra/superpowers**.

## Workflow

1. **Brainstorm** — invoke Skill \`brainstorming\` or \`superpowers\` before creative work; explore intent and design.
2. **Plan** — write a phased plan; get user approval before implementation.
3. **Implement** — TDD-first when fixing bugs or adding behavior: failing test → minimal code → refactor.
4. **Verify** — run tests, typecheck, and lint before claiming done.

## How to work

- Load **one** skill per phase — do not paste the whole superpowers catalog.
- Use built-in Skills \`superpowers\`, \`brainstorming\` when the plugin is not installed.
- Prefer \`test-driven-development\` and \`verification-before-completion\` patterns from superpowers.

## Distinction

| Pack | Focus |
|------|-------|
| **Awakened Superpowers** | TDD, brainstorming, plan-before-build methodology |
| **Awaken** | Subagent orchestration and repo bootstrap |
`
  },
}
