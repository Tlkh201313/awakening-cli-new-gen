# Awakened Taste (Taste-Skill)

Premium frontend anti-slop playbook. Upstream: [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (install name `design-taste-frontend`).

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend
```

Use for **new UI**, **redesigns**, and **marketing pages** when output must not look like generic AI templates.

## Baseline dials (1–10)

Unless the user overrides in chat:

| Dial | Default | Meaning |
|------|---------|---------|
| DESIGN_VARIANCE | 8 | Layout experimentation (low = centered, high = asymmetric) |
| MOTION_INTENSITY | 6 | Hover-only → scroll/magnetic choreography |
| VISUAL_DENSITY | 4 | Airy gallery → dense cockpit |

## Stack defaults

- React / Next.js — Server Components first; isolate `'use client'` for motion/glass leaves
- Tailwind v3/v4 — check `package.json` before syntax; v4 uses `@tailwindcss/postcss`
- **No emojis** in UI — icons: Phosphor or Radix only
- `min-h-[100dvh]` not `h-screen` for heroes
- CSS Grid over flex percentage math
- Verify deps before import (`framer-motion`, etc.)

## Anti-slop rules (critical)

- **No AI purple/lila** gradients or neon glows — neutral Zinc/Slate + one accent
- **No Inter** as default display font — Geist, Outfit, Cabinet Grotesk, Satoshi
- **No serif** on dashboards
- **No centered hero** when DESIGN_VARIANCE > 4 — split/asymmetric layouts
- **No 3-column equal card rows** — zig-zag, bento, or horizontal scroll
- Max **one accent** color; saturation < 80%
- Cards only when elevation communicates hierarchy

## Interaction states (required)

Implement loading (skeleton), empty, error, and `:active` tactile feedback — not static happy-path only.

## Motion

- Animate `transform` and `opacity` only
- MOTION_INTENSITY > 5: Framer `useMotionValue` for magnetic hover — not `useState` loops
- Do not mix GSAP and Framer in the same component tree
- `staggerChildren` parent and children in the same client subtree

## Awakened product UI

When building **this monorepo** or user says Awakened brand: load skill **design** (Awakened Design) for tokens in `packages/ui/src/v2` — Taste-Skill rules still apply for layout/motion; brand colors win over generic palettes.

## Variants (upstream repo)

| Install name | When |
|--------------|------|
| design-taste-frontend | Default premium UI |
| gpt-taste | Stricter GPT/Codex, more motion |
| minimalist-ui | Notion/Linear editorial |
| industrial-brutalist-ui | Swiss brutal (beta) |
| redesign-existing-projects | Audit existing UI first |
| image-to-code | Image comps → implement |

## Pre-flight

- Mobile collapse for asymmetric layouts (`w-full`, single column < md)
- `React.memo` on perpetual animation leaf components
- Empty/loading/error states present
- No filler copy ("Elevate", "Seamless", "Next-Gen")

## Related skills

`frontend`, **design** (Awakened brand), `webapp-testing` for E2E after UI work.
