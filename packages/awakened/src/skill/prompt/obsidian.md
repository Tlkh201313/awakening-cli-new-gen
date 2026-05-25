# Obsidian MCP Guide

Connect awakened to your Obsidian vault via [mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian).

## Prerequisites

1. Obsidian running with [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) enabled
2. API key copied from plugin settings
3. [uv](https://docs.astral.sh/uv/) installed (`uvx` on PATH)

## Config snippet

Add to `awakened.json` — replace only `OBSIDIAN_API_KEY`:

```json
{
  "mcp": {
    "obsidian": {
      "type": "local",
      "command": ["uvx", "mcp-obsidian"],
      "enabled": true,
      "environment": {
        "OBSIDIAN_API_KEY": "PASTE_KEY_FROM_OBSIDIAN_PLUGIN",
        "OBSIDIAN_HOST": "127.0.0.1",
        "OBSIDIAN_PORT": "27124"
      }
    }
  }
}
```

Restart awakened. Verify with `awakened mcp list`.

## When to use

Search vault notes, summarize meetings, append email-ready summaries, cross-link research.

## Rules

- Search before asking the user to paste note text.
- Prefer append/patch over full-file overwrite.
- Keep Obsidian open while MCP tools run.
