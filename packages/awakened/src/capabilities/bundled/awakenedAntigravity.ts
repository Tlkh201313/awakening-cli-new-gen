import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const ANTIGRAVITY_RE =
  /\b(antigravity|@brainstorming|@webapp-testing|skill bundle|agentic skill|awesome skills|npx antigravity|1464|workflow skill|claude code skill catalog)\b/i

const BROAD_SKILL_RE = /\b(use @|invoke @|run @|skill playbook|SKILL\.md catalog)\b/i

export const awakenedAntigravityCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.antigravity,
  displayName: "Awakened Skills Vault",
  description: "Antigravity Awesome Skills — 1,400+ agent playbooks",
  priority: 60,
  shouldActivate(ctx) {
    return ANTIGRAVITY_RE.test(ctx.userText) || BROAD_SKILL_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Skills Vault

Upstream: https://github.com/sickn33/antigravity-awesome-skills (1,464+ SKILL.md playbooks).

## Install

\`\`\`bash
npx antigravity-awesome-skills
# default: ~/.gemini/antigravity/skills — use --path for other agents
\`\`\`

Plugins for Claude Code / Codex: see repo \`docs/users/plugins.md\`. Bundles & workflows: \`docs/users/bundles.md\`, \`docs/users/workflows.md\`.

## How to work

1. Match user intent to **one** skill or bundle (brainstorming, webapp-testing, security-review, etc.) — browse repo \`skills/\` or use stable manifest v1.
2. Invoke with \`Use @skill-name …\` after install, or **Read** the skill's SKILL.md from the install path.
3. Do not paste the whole catalog into context — load only the relevant SKILL.md.

## Examples

\`Use @brainstorming to plan a SaaS MVP\` · \`Use @webapp-testing for Playwright checks\`

## Distinction

Awakened Research / Marketing packs are domain-specific; this vault is the broad multi-domain library (dev, security, product, growth).
`
  },
}
