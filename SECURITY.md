# Security

## Before you push or publish

- **Never commit** `.env`, `auth.json`, API keys, OAuth tokens, or provider profiles with real credentials.
- This repo’s `.gitignore` excludes `.env*`, `auth.json`, `dist/`, `node_modules/`, and user config filenames (`.awakened.json`, `.awakened-profile.json`, etc.).
- Run a quick secret scan before push:

  ```bash
  git grep -E 'sk-ant-api|sk-proj-|ghp_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}' -- ':!*.test.*' ':!*test*'
  ```

  Test files may contain **fake** keys like `sk-test-key`; that is expected.

## Where user secrets live (not in the repo)

After install, Awakened stores data under the user home directory (same pattern as OpenClaude / Claude Code):

| Location | Contents |
|----------|----------|
| `~/.awakened/` | Settings, skills, plugins, sessions, local npm install |
| `~/.awakened.json` | Global config (OAuth state, preferences) |
| `~/.awakened-profile.json` | Optional provider profile (if used) |
| `./.awakened/` | Per-project settings, agents, skills |

On first run, existing `~/.openclaude` and `~/.claude` data is **copied** into `~/.awakened` (missing files only; nothing deleted).

Override home with `CLAUDE_CONFIG_DIR` (same env name as upstream for compatibility).

## MCP and project config

- `.mcp.json` in this repo uses `Bearer ${OBSIDIAN_API_KEY}` — set the variable in your environment, not in git.
- Do not commit project `.awakened/settings.local.json` with machine-specific secrets.

## Reporting issues

Open a private security issue or contact the maintainers via [GitHub Issues](https://github.com/Tlkh201313/awakening-cli-new-gen/issues) if you find a vulnerability.
