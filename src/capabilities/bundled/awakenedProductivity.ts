import { AWAKENED_CAPABILITY_IDS } from '../ids.js'
import type { AutoCapabilityDefinition } from '../types.js'

const PRODUCTIVITY_RE =
  /\b(voltagent|awesome-agent-skills|officialskills\.sh|productivity skill|agent skill catalog|hand-picked skills|install skills for claude|npx skills|anthropic official skill|stripe skill|vercel skill)\b/i

export const awakenedProductivityCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.productivity,
  displayName: 'Awakened Productivity',
  description: 'VoltAgent curated agent skills for productivity',
  priority: 65,
  shouldActivate({ userText }) {
    return PRODUCTIVITY_RE.test(userText)
  },
  getContent() {
    return `# Awakened Productivity

Upstream: https://github.com/VoltAgent/awesome-agent-skills — **1,100+** official-team curated skills (Stripe, Vercel, Anthropic, etc.).

## Install & browse

- Repo README: clone or follow install paths for Claude Code, Cursor, Codex.
- Browse/install via **officialskills.sh** when the user wants a catalog UI.

## How to work

1. Match intent to **one** skill per task — do not load multiple SKILL.md files.
2. **Read** only the relevant \`SKILL.md\` from the install path; do not paste the catalog into context.
3. Paths and agent compatibility: follow repo README (Claude Code / Cursor / Codex layouts differ).

## Distinction

| Pack | Source | Size | Focus |
|------|--------|------|-------|
| **Awakened Skills Vault** | antigravity-awesome-skills | 1,400+ | Community multi-domain playbooks |
| **Awakened Productivity** | VoltAgent awesome-agent-skills | 1,100+ | Official-team curated productivity & integrations |

Use Vault for broad @-skill playbooks; use Productivity for hand-picked official-team skills (Stripe, Vercel, Anthropic patterns, etc.).
`
  },
}
