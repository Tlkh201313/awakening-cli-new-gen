import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const CONTEXT7_RE =
  /\b(context7|library docs|framework documentation|latest api for|npm package docs|how do i use (?:the )?(?:react|next|vue|django|fastapi|stripe|supabase)|official docs for)\b/i

export const awakenedContext7Capability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.context7,
  displayName: "Awakened Context7",
  description: "Up-to-date library documentation via Context7 MCP",
  priority: 64,
  shouldActivate(ctx) {
    return CONTEXT7_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Context7

Upstream: **Context7 MCP** — fetches current library/framework documentation instead of guessing from training data.

## Setup

Add Context7 MCP in \`awakened.json\` (requires \`CONTEXT7_API_KEY\`):

\`\`\`json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": { "CONTEXT7_API_KEY": "YOUR_KEY" }
    }
  }
}
\`\`\`

## Workflow

1. Resolve library ID via Context7 before answering API questions.
2. Cite doc snippets; do not invent method signatures.
3. Prefer Context7 over web search for version-specific APIs.

Skill \`context7\` (built-in) summarizes awakened wiring.
`
  },
}
