# MCP Server Status

**Last updated:** 2026-05-23

## Enabled Servers

| Server | Transport | Status | Auth | Notes |
|--------|-----------|--------|------|-------|
| `mcp-obsidian` | HTTP | `needs-auth` | `${OBSIDIAN_API_KEY}` | Local Obsidian vault. Set env var in `.env` or system. |

## Configuration Scope

**Merge order (lowest → highest precedence):**
```
claude.ai < plugin < user < project < local
```

**Project config:** `.mcp.json` (this repo)  
**User config:** `~/.claude/settings.json` → `mcpServers`  
**Plugin config:** Plugin manifests (auto-loaded when plugin enabled)

## Health Check

**Manual verification (requires REPL):**
1. Start OpenClaude in this repo
2. Run `/mcp` → verify `mcp-obsidian` listed
3. Check status: `connected` or `needs-auth`
4. If `needs-auth`: set `OBSIDIAN_API_KEY` env var, restart session

**Automated check:**
```bash
openclaude mcp doctor
```

## Adding New Servers

**HTTP server:**
```bash
openclaude mcp add --transport http <name> <url> --header "Authorization: Bearer ${API_KEY}"
```

**stdio server:**
```bash
openclaude mcp add <name> -- npx <package>
```

**After adding:**
1. Update this doc
2. Add env var to `.env.example` if auth required
3. Run `/mcp` in REPL to verify

## Disabled Servers

None currently.

## Errors

None currently. Check `getAllMcpConfigs().errors` in REPL for runtime issues.
