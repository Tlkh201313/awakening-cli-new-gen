# Awakened open-build feature matrix

This documents what the **open build** enables at compile time. Source of truth: [`scripts/build.ts`](../scripts/build.ts) `featureFlags`. Rebuild after changing flags (`bun run build`).

## Disabled (missing upstream infra or source)

| Flag | User-visible impact |
|------|---------------------|
| `PROACTIVE` | No autonomous tick / sleep agent loop (`src/proactive/` is a no-op stub) |
| `KAIROS` | No persistent assistant / Kairos session mode |
| `BRIDGE_MODE` | No remote desktop bridge via CCR |
| `DAEMON` | No background daemon process |
| `AGENT_TRIGGERS` | No scheduled remote agent triggers |
| `ABLATION_BASELINE` | No A/B eval harness |
| `CONTEXT_COLLAPSE` | No context-collapse optimization |
| `COMMIT_ATTRIBUTION` | No Co-Authored-By git hook (`postCommitAttribution` stub) |
| `UDS_INBOX` | No Unix-domain-socket inter-session inbox |
| `BG_SESSIONS` | No tmux background sessions |
| `WEB_BROWSER_TOOL` | No built-in browser automation tool |
| `CHICAGO_MCP` | No computer-use MCP (native Swift not mirrored) |
| `COWORKER_TYPE_TELEMETRY` | No coworker-type telemetry |
| `MCP_SKILLS` | No dynamic MCP skill discovery (enabling can break MCP resource servers — see build comment / #856) |

## Enabled (shipped in this fork)

| Flag | What you get |
|------|----------------|
| `VOICE_MODE` | Hold-to-talk / voice input (when configured) |
| `COORDINATOR_MODE` | Multi-agent coordinator + worker delegation |
| `BUILTIN_EXPLORE_PLAN_AGENTS` | Built-in Explore / Plan subagents |
| `BUDDY` | Buddy paired-programming mode |
| `MONITOR_TOOL` | MCP server monitoring tool |
| `TEAMMEM` | Team memory sync |
| `MESSAGE_ACTIONS` | Message action buttons in the UI |
| `DUMP_SYSTEM_PROMPT` | `--dump-system-prompt` debugging flag |
| `CACHED_MICROCOMPACT` | Cache-aware tool-result truncation |
| `AWAY_SUMMARY` | “While you were away” recap after idle blur |
| `TRANSCRIPT_CLASSIFIER` | Auto-approval classifier for safe tool uses |
| `ULTRATHINK` | Type `ultrathink` for deeper reasoning mode |
| `TOKEN_BUDGET` | Token budget tracking + warnings |
| `HISTORY_PICKER` | Enhanced prompt history picker |
| `QUICK_SEARCH` | Ctrl+G quick search across prompts |
| `SHOT_STATS` | Shot distribution in session summary |
| `EXTRACT_MEMORIES` | Auto-extract durable memories |
| `FORK_SUBAGENT` | Implicit context fork when omitting `subagent_type` |
| `VERIFICATION_AGENT` | Read-only verification subagent |
| `PROMPT_CACHE_BREAK_DETECTION` | Logs unexpected prompt-cache invalidation |
| `HOOK_PROMPTS` | Tools can request interactive user prompts |

## Privacy / telemetry

- Build uses [`scripts/no-telemetry-plugin.ts`](../scripts/no-telemetry-plugin.ts) to stub phone-home modules.
- After `bun run build`, run `bun run verify:privacy` to scan `dist/cli.mjs` for banned patterns.

## Permission modes (safety)

| Mode | Behavior |
|------|----------|
| `default` | Standard permission prompts |
| `acceptEdits` | Auto-accept file edits; ask for shell/other |
| `plan` | Analysis only (no mutating tools) |
| `bypassPermissions` | Auto-accept **all** tools — dangerous; requires explicit opt-in |
| `dontAsk` | Minimize prompts where policy allows |

Do not use `bypassPermissions` on untrusted repos or with untrusted models. Prefer `acceptEdits` or classifier auto-mode when you understand the risk.
