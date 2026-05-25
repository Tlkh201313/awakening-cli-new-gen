import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const FRONTEND_RE =
  /\b(react\b|next\.?js|vue\b|svelte|tailwind|css module|component library|design system|core web vitals|lighthouse|accessibility|a11y|wcag|responsive layout|solidjs)\b/i

export const awakenedFrontendCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.frontend,
  displayName: "Awakened Frontend",
  description: "React, Next.js, Tailwind, and UI playbooks",
  priority: 66,
  shouldActivate(ctx) {
    return FRONTEND_RE.test(ctx.userText) || primaryBootstrap(ctx)
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
| **Awakened Frontend** | React/Next/Tailwind implementation |
| **Awakened Testing** | Playwright/E2E verification |
| **Awakened Browser** | Live site debugging in real browser |
`
  },
}
