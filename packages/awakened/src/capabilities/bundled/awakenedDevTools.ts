import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const DEVTOOLS_RE =
  /\b(stripe (?:api|webhook|checkout|billing)|vercel (?:deploy|preview|edge)|cloudflare (?:workers|dns|pages)|aws deploy|terraform apply|github actions deploy|supabase|planetscale)\b/i

export const awakenedDevToolsCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.devtools,
  displayName: "Awakened DevTools",
  description: "Official integration skills — Stripe, Vercel, Cloudflare, AWS",
  priority: 68,
  shouldActivate(ctx) {
    return DEVTOOLS_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened DevTools

Point to **VoltAgent/officialskills** and vendor official skills — **one skill per task**.

## Catalogs

- **VoltAgent awesome-agent-skills**: https://github.com/VoltAgent/awesome-agent-skills
- Browse/install via **officialskills.sh** for Stripe, Vercel, Anthropic official patterns.

## How to work

1. Match intent to **one** integration (Stripe webhook, Vercel deploy, Cloudflare Workers, etc.).
2. **Read** only the relevant \`SKILL.md\` from the install path — do not load multiple vendor skills.
3. Follow vendor docs in the skill; use MCP or CLI tools the skill specifies.

## Examples

| Task | Skill source |
|------|----------------|
| Stripe billing | Stripe official skill from awesome-agent-skills |
| Vercel deploy | Vercel official skill |
| Anthropic API | Anthropic official skill |

## Distinction

| Pack | Focus |
|------|-------|
| **Awakened Productivity** | Broad officialskills catalog browse |
| **Awakened DevTools** | Deploy/integration tasks (Stripe, Vercel, Cloudflare, AWS) |
`
  },
}
