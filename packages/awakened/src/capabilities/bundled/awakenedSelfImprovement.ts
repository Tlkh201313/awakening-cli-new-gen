import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const SELF_IMPROVEMENT_RE =
  /\b(self[- ]?improv|awakened-self-improvement|\/learn\b|extract learnings|update AGENTS\.md|improve AGENTS\.md|\/init\b|bootstrap agents|codify learnings|session learnings|repo instructions|agent instructions|remember for next time|write this to agents|learnings from this session|improve our workflow|update project rules)\b/i

export const awakenedSelfImprovementCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.selfImprovement,
  displayName: "Awakened Self-Improvement",
  description: "Session learnings → AGENTS.md, /learn, /init, and persistent memory",
  priority: 59,
  shouldActivate(ctx) {
    return SELF_IMPROVEMENT_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Self-Improvement

Turn session discoveries into durable agent context — without bloating prompts.

## Built-in commands

| Command | Purpose |
|---------|---------|
| \`/init\` | Bootstrap or refresh root \`AGENTS.md\` from the codebase |
| \`/learn\` | Extract **non-obvious** session learnings into scoped \`AGENTS.md\` files |
| \`/remember\` | Quick-save durable notes via awakened-memory |

## Where learnings live

Place \`AGENTS.md\` as close to relevant code as possible (parent dirs auto-load on \`read\`):

- Project-wide → repo root \`AGENTS.md\`
- Package/module → \`packages/foo/AGENTS.md\`
- Feature → \`src/auth/AGENTS.md\`

## What to capture (1–3 lines each)

- Hidden file/module relationships · non-obvious env vars or flags
- Misleading errors and real fixes · build/test commands missing from README
- Files that must change together · architectural constraints

## What to skip

Obvious docs, session-specific chatter, duplicates of existing \`AGENTS.md\` bullets, long prose.

## Workflow

1. After non-trivial work, run \`/learn\` or manually update scoped \`AGENTS.md\`.
2. Use \`mem_save\` for cross-session preferences; use \`AGENTS.md\` for repo-specific facts.
3. After changing workflows, verify \`AGENTS.md\` still matches reality.

## Upstream patterns (optional)

- [obra/superpowers](https://github.com/obra/superpowers) — \`finishing-a-development-branch\`, \`receiving-code-review\` for session wrap-up
- [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) — productivity capture/reflect pods

Load skill \`self-improvement\` for the full playbook.
`
  },
}
