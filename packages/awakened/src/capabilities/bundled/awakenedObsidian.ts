import { AWAKENED_CAPABILITY_IDS } from "../ids"
import {
  OBSIDIAN_MCP_UPSTREAM,
  OBSIDIAN_REST_API_PLUGIN,
  obsidianMcpAwakenedJsonSnippet,
} from "../mcp-templates/obsidian"
import type { AutoCapabilityDefinition } from "../types"

const OBSIDIAN_RE =
  /\b(obsidian|mcp-obsidian|obsidian vault|vault note|wikilink|daily note|local rest api|meeting notes in obsidian|search my notes|append to note|obsidian plugin)\b/i

export const awakenedObsidianCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.obsidian,
  displayName: "Awakened Obsidian",
  description: "Obsidian vault via mcp-obsidian + Local REST API (easy MCP setup)",
  priority: 65,
  shouldActivate({ userText }) {
    return OBSIDIAN_RE.test(userText)
  },
  getContent() {
    return `# Awakened Obsidian

Upstream MCP: ${OBSIDIAN_MCP_UPSTREAM}
Required Obsidian plugin: ${OBSIDIAN_REST_API_PLUGIN}

## Easy setup (2 steps)

### Step 1 — Obsidian plugin (one time)

1. Open Obsidian → **Settings → Community plugins → Browse**
2. Install **Local REST API** (\`obsidian-local-rest-api\`) — docs: ${OBSIDIAN_REST_API_PLUGIN}
3. Enable the plugin → **Settings → Local REST API** → copy the **API key**
4. Keep Obsidian running while using MCP (default: \`https://127.0.0.1:27124\`)

### Step 2 — Awakened MCP (paste & replace key)

Add to project \`awakened.json\` or global \`~/.config/awakened/awakened.json\`. **Only replace \`OBSIDIAN_API_KEY\`** — host/port defaults work for most installs.

\`\`\`json
${obsidianMcpAwakenedJsonSnippet()}
\`\`\`

Requires [uv](https://docs.astral.sh/uv/) for \`uvx\`. If \`uvx\` is not on PATH, use the full path from \`where uvx\` (Windows) or \`which uvx\` (macOS/Linux) as the first \`command\` element.

Restart awakened after saving config (\`awakened mcp list\` should show \`obsidian\` connected).

## Tools (via MCP)

list_files_in_vault · list_files_in_dir · get_file_contents · search · patch_content · append_content · delete_file

## Workflow

1. Tell the agent you use Obsidian so it picks MCP tools proactively.
2. Search vault before asking the user to paste note contents.
3. Prefer \`append_content\` / \`patch_content\` for summaries — do not overwrite whole notes without confirmation.

Load skill \`obsidian\` for quick reference. See \`customize-awakened\` for MCP schema details.
`
  },
}
