import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const MEMORY_RE =
  /\b(claude[- ]?mem|engram|persistent memory|remember (?:this|across sessions)|session memory|memory search|did we already|cross[- ]?session|knowledge base|mem[- ]?search|awakened[- ]?memory|auto[- ]?save)\b/i

export const awakenedMemoryCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.memory,
  displayName: "Awakened Memory",
  description: "Persistent memory and cross-session recall (Claude-mem style auto-save)",
  priority: 58,
  shouldActivate(ctx) {
    if (MEMORY_RE.test(ctx.userText)) return true
    if (ctx.toolNames.some((name) => name.startsWith("mem_"))) return true
    return primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Memory

Built-in **awakened-memory** (Claude-mem style, simplified for Awakened).

## Auto (default on)

- **Auto-recall** — relevant saved notes injected each turn
- **Auto-save** — user preferences ("remember this…"), tool outcomes, turn summaries
- Configure in \`awakenedMemory\`: \`autoSave\`, \`autoRecall\`, \`maxRecall\`, \`defaultScope\`

## Tools

- \`mem_save\` — persist decisions, conventions, commands
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

- Auto layer handles routine recall/save; use \`mem_save\` for critical facts it may miss.
- Save concise bullets with paths and commands — not full transcripts.
- Prefer project scope; global only for cross-repo preferences.
`
  },
}
