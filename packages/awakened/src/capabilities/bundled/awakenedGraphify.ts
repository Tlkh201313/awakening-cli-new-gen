import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const GRAPHIFY_RE =
  /\b(graphify|knowledge graph|GraphRAG|graphify-out|graph\.json query|\/graphify|reduce tokens|token budget|massive codebase|map codebase|understand architecture|explore repo|corpus graph|obsidian graph|read entire codebase|too many files to read)\b/i

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

## Awakened improvements for massive token reduction

### Install

\`\`\`bash
pip install graphifyy && graphify install
\`\`\`

(PyPI package name is **graphifyy**.)

### Before batch-reading many files

1. Check \`graphify-out/graph.json\` in cwd/project.
2. If it exists: use \`graphify query "…" --budget 1500\` (or \`--dfs\` for paths) instead of Read/BatchRead on source files.
3. Trust **EXTRACTED** vs **INFERRED** edges; prefer query results over re-reading raw files.

### If no graph yet (broad codebase/corpus context)

1. Run \`/graphify .\` or \`graphify <path>\` **once** per project/session — do not re-ingest every turn.
2. Then query; use \`--update\` for incremental changes only.

### Wiki mode (large graphs)

\`graphify --wiki\` then read \`graphify-out/wiki/index.md\` **one article at a time**. Never dump full \`graph.json\` or GRAPH_REPORT into context.

### Other commands

- \`graphify path A B\` — route between nodes
- \`graphify explain NODE\` — node context
- \`graphify add <url>\` — web corpus ingestion
- \`graphify --watch\` or \`graphify hook install\` — keep graph fresh during long sessions

## Distinction

Awakened Skills Vault / Productivity are skill catalogs; Graphify is a **structural corpus index** for querying instead of reading thousands of files.
`
  },
}
