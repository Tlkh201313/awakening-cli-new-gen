import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const SIMPLIFY_RE =
  /\b(simplify|reduce complexity|refactor (?:this|for clarity)|dead code|remove duplication|clean up (?:this )?code|yagni|over[- ]?engineered|too many abstractions|slim down)\b/i

export const awakenedSimplifyCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.simplify,
  displayName: "Awakened Simplify",
  description: "Reduce complexity and remove dead code",
  priority: 55,
  shouldActivate(ctx) {
    return SIMPLIFY_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Simplify

Built-in Skill \`simplify\` (from openclaude/awakened lineage) + antigravity **refactoring** playbooks.

## Workflow

1. **Understand** — what behavior must stay? write down invariants.
2. **Delete** — remove unused code, imports, and flags first.
3. **Inline** — collapse single-use helpers unless name clarifies a real boundary.
4. **Verify** — tests + typecheck; behavior unchanged.

## Rules

- Smallest diff that reduces complexity — no drive-by feature adds.
- Do not extract new abstractions during a simplify pass.
- Prefer early returns over nested conditionals (match awakened AGENTS.md).

## Distinction

| Pack | Focus |
|------|-------|
| **Awakened Simplify** | Shrink and clarify existing code |
| **Awakened Code Review** | Review others' diffs |
| **Awakened Superpowers** | Plan before large features |
`
  },
}
