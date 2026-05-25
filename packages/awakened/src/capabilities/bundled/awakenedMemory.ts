import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const MEMORY_RE =
  /\b(claude[- ]?mem|awakened[- ]?mem|engram|persistent memory|remember (?:this|across sessions)|session memory|memory search|did we already|cross[- ]?session|knowledge base|mem[- ]?search|awakened[- ]?memory|auto[- ]?save|get_observations)\b/i

export const awakenedMemoryCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.memory,
  displayName: "Awakened Memory",
  description: "Persistent memory and cross-session recall (Claude-mem fork, aggressive save)",
  priority: 58,
  shouldActivate(ctx) {
    if (MEMORY_RE.test(ctx.userText)) return true
    if (ctx.toolNames.some((name) => name.startsWith("mem_"))) return true
    return primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Memory

Built-in **awakened-memory** — fork of Claude-mem workflows, simplified storage for Awakened.

## Skills (load with skill tool)

| Skill | When |
|-------|------|
| **awakened-mem** | Default — save on every meaningful output, tag vocabulary |
| **mem-search** | "Did we already…?", prior sessions, before reversing decisions |

## Auto (default on)

- **Auto-recall** — relevant saved notes injected each turn
- **Auto-save** — preferences, tool outcomes, assistant summaries (incl. without edits)
- Configure in \`awakenedMemory\`: \`autoSave\`, \`autoRecall\`, \`maxRecall\`, \`defaultScope\`

## Tools

- \`mem_save\` — persist decisions, conventions, commands (**use every turn** for durable facts)
- \`mem_search\` — keyword search before re-deciding
- \`mem_list\` — browse recent entries

## Storage

- Project: \`.awakened/memory/entries.jsonl\`
- Global: \`~/.local/share/awakened/memory/entries.jsonl\`

## Commands

- \`/remember\` — save durable notes (or quick-save with text)
- \`/mem-search\` — search saved memories
- \`/mem\` — browse in TUI

## Rules

1. **mem_search** before redoing prior fixes or architecture choices.
2. **mem_save** after each turn with decisions, bugfixes, file paths, or verification commands.
3. Concise bullets — not full transcripts. Tags: bugfix, feature, decision, discovery, change.
4. Prefer project scope; global only for cross-repo preferences.
`
  },
}
