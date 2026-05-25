import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const GRAPHIFY_RE =
  /\b(graphify|knowledge graph|GraphRAG|graphify-out|graph\.json query|\/graphify|reduce tokens|token budget|massive codebase|map codebase|understand architecture|explore repo|corpus graph|obsidian graph|read entire codebase|too many files to read|explore.*large|map.*codebase|understand.*structure)\b/i

export const awakenedGraphifyCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.graphify,
  displayName: "Awakened Graphify",
  description: "Knowledge graphs — ~71x token savings on large corpora",
  priority: 75,
  shouldActivate(ctx) {
    return GRAPHIFY_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Graphify

Upstream: https://github.com/safishamsi/graphify — knowledge graphs with large-corpus token reduction (README benchmark: **71.5x** on mixed corpora vs naive full-file reads).

## Auto-use rule (ALWAYS follow)

Before reading 5+ files to understand code structure, architecture, or relationships:
1. Check if \`graphify-out/graph.json\` exists in the project root.
2. If it exists: use \`graphify query "…" --budget 1500\` instead of reading files.
3. If it does NOT exist: run \`graphify extract .\` once (AST extraction, no LLM cost), then query.
4. Only fall back to reading individual files if graphify doesn't answer the question.

## Commands

\`\`\`bash
# Build graph (AST-only, no API key needed)
graphify update .

# Full semantic extraction (needs ANTHROPIC_API_KEY or MOONSHOT_API_KEY)
graphify extract .

# Query instead of reading files
graphify query "How does auth work?" --budget 1500
graphify query "Where is session created?" --budget 1000 --dfs

# Explain a node
graphify explain "Session.Service"

# Find path between two concepts
graphify path "Config" "Session"

# Watch for changes
graphify watch .
\`\`\`

## When to use graphify vs reading files

| Situation | Use graphify | Read files |
|-----------|-------------|------------|
| "How does X work?" (architecture) | Yes | No |
| "Where is Y defined?" (locate) | Yes | No |
| "Fix this specific bug in file.ts" | No | Yes |
| "Read this file and edit it" | No | Yes |
| "Explore the whole codebase" | Yes | No |
| "Understand the module structure" | Yes | No |

## Token savings

- \`graphify query\` returns structural results in ~500-1500 tokens
- Reading 10 source files costs ~50,000+ tokens
- Savings: **~30-70x** depending on codebase size

## Notes

- \`graphify update .\` — AST-only, free, fast. Use after code changes.
- \`graphify extract .\` — LLM-enriched semantic edges. Costs tokens but richer graph.
- Never dump full \`graph.json\` into context — it's too large.
- Use \`--budget N\` to cap output tokens.
`
  },
}
