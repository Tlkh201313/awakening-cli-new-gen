import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import { matchesFrameworkFrontend } from "../triggers/frontend"
import { matchesStaticHtmlUi } from "../triggers/design"
import type { AutoCapabilityDefinition } from "../types"

export const awakenedFrontendCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.frontend,
  displayName: "Awakened Frontend",
  description: "React, Next.js, Tailwind, and component implementation",
  priority: 66,
  shouldActivate(ctx) {
    if (matchesStaticHtmlUi(ctx.userText)) return false
    return matchesFrameworkFrontend(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Frontend

Invoke Skill \`frontend\` or antigravity **@react-best-practices**, **@nextjs-best-practices**, **@tailwind-patterns**.

## Workflow

1. Read surrounding components — match patterns, tokens, and state style.
2. Prefer server components (Next.js App Router) unless interactivity requires client.
3. Accessibility: labels, focus order, keyboard nav — not afterthought.
4. Performance: avoid unnecessary client bundles; measure before micro-optimizing.

## Rules

- Do not introduce new UI libraries without user approval.
- Keep diffs scoped to the requested UI change.
- Run lint/typecheck on touched packages.

## Distinction

| Pack | Focus |
|------|-------|
| **Awakened Design** | Static HTML, landings, Awakened brand, @frontend-design |
| **Awakened Frontend** | React/Next/Tailwind in this repo |
| **Awakened Testing** | Playwright/E2E verification |
| **Awakened Browser** | Live site debugging in real browser |
`
  },
}
