import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { matchesAwakenedTasteCapability } from "../triggers/taste"
import type { AutoCapabilityDefinition } from "../types"

export const awakenedTasteCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.taste,
  displayName: "Awakened Taste",
  description: "Premium anti-slop UI (Taste-Skill) — layout, typography, motion",
  priority: 69,
  shouldActivate(ctx) {
    return matchesAwakenedTasteCapability(ctx.userText)
  },
  getContent() {
    return `# Awakened Taste

Upstream: [taste-skill](https://github.com/Leonxlnx/taste-skill) — install \`design-taste-frontend\` via \`npx skills add https://github.com/Leonxlnx/taste-skill\`.

## Required

1. Load built-in skill **awakened-taste** (full anti-slop playbook) before writing UI code.
2. For Awakened product chrome, also load skill **design** for v2 tokens — Taste rules still govern layout/motion.

## Defaults

- DESIGN_VARIANCE 8 · MOTION_INTENSITY 6 · VISUAL_DENSITY 4
- No Inter, no purple AI gradients, no generic 3-card feature rows
- Full interaction states: loading, empty, error, active press

## When to skip

- Backend-only, CLI/TUI, or user explicitly wants minimal/plain UI
- In-repo fixes that must match existing components exactly — follow neighbors first

## Rules

- Check \`package.json\` before adding UI libraries
- \`min-h-[100dvh]\` not \`h-screen\` for heroes
- One accent color; Grid over flex math
`
  },
}
