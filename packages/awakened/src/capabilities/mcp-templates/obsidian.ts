/** Awakened-ready MCP config for MarkusPfundstein/mcp-obsidian */
export const OBSIDIAN_MCP_SERVER_NAME = "obsidian"

export const OBSIDIAN_MCP_UPSTREAM = "https://github.com/MarkusPfundstein/mcp-obsidian"
export const OBSIDIAN_REST_API_PLUGIN = "https://github.com/coddingtonbear/obsidian-local-rest-api"

export const OBSIDIAN_MCP_TEMPLATE = {
  type: "local" as const,
  command: ["uvx", "mcp-obsidian"],
  enabled: true,
  environment: {
    OBSIDIAN_API_KEY: "PASTE_KEY_FROM_OBSIDIAN_PLUGIN",
    OBSIDIAN_HOST: "127.0.0.1",
    OBSIDIAN_PORT: "27124",
  },
}

export function obsidianMcpAwakenedJsonSnippet() {
  return JSON.stringify({ mcp: { [OBSIDIAN_MCP_SERVER_NAME]: OBSIDIAN_MCP_TEMPLATE } }, null, 2)
}
