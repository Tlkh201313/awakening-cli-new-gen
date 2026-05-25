import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { matchesAwakenedDesignCapability } from "../triggers/design"
import type { AutoCapabilityDefinition } from "../types"

export const awakenedDesignCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.design,
  displayName: "Awakened Design",
  description: "Awakened brand, static HTML/CSS, UI/UX, accessibility",
  priority: 68,
  shouldActivate(ctx) {
    return matchesAwakenedDesignCapability(ctx.userText)
  },
  getContent() {
    return `# Awakened Design

You are doing **visual UI work**. Do not ship generic gradient templates or stock AI aesthetics.

## Required before writing UI

1. **Awakened brand** (when building for this product or user says "awakened design"):
   - Read \`packages/ui/src/v2/styles/colors.css\` and \`theme.css\` for tokens
   - Dark base \`#161616\`, accent \`#3b5cf6\`, grey scale, panel chrome like \`dialog-awakened-capabilities.tsx\`
   - Use ✦ mark, "Packs · tools · cost · speed" tone — not purple AI slop
   - Optional Nord theme: \`.awakened/themes/mytheme.json\`

2. **Static HTML/CSS** (single file or static site):
   - Inline or embedded CSS using design tokens as CSS variables
   - Semantic HTML, focus states, prefers-color-scheme or explicit theme toggle
   - Load **Skill \`frontend-design\`** or **@frontend-design** for layout/type/spacing decisions

3. **In-repo React/Next** — prefer pack **Awakened Frontend** instead; match existing components in \`packages/app\` / \`packages/ui\`.

## Skills to invoke (one per task)

| Task | Skill |
|------|-------|
| Visual direction, typography, layout | \`frontend-design\` / @frontend-design |
| Tailwind v4 patterns | @tailwind-patterns |
| Forms / CRO | @form-cro |
| WCAG / a11y audit | accessibility testing skill |

## Rules

- Match Awakened v2 when the user mentions awakened, this repo, or product UI
- Never default to unrelated design systems (Material, random gradients)
- Static HTML: one self-contained file unless user asks for more
- Run accessibility basics: contrast, labels, keyboard focus

## Anti-patterns

- Generic "build html website" with zero brand lookup
- Inter font + purple gradient + hero blob (unless user explicitly asks)
- Ignoring \`/awakened\` capability or theme files in this monorepo
`
  },
}
