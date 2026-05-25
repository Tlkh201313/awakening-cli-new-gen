# Awakened Memory (Claude-mem fork)

Persistent cross-session memory for Awakened. **Save aggressively** — every durable fact from your work should land in memory, not only when the user says "remember".

## When to use

- User asks about **prior sessions** ("did we already fix this?", "how did we do X last time?")
- You make a **decision**, fix a **bug**, discover **root cause**, or change **conventions**
- End of any turn where you edited code, ran commands, or resolved an issue
- Before reversing a prior approach — **mem_search first**

## Tools (built-in)

| Tool | Use |
|------|-----|
| `mem_search` | Keyword search — cheap index pass before re-deciding |
| `mem_save` | Persist title + bullets (paths, commands, why) |
| `mem_list` | Browse recent entries when search is too narrow |

Storage: project `.awakened/memory/entries.jsonl`, global `~/.local/share/awakened/memory/entries.jsonl`.

## Save on every meaningful output

Auto-save runs for preferences, tool outcomes, and turn summaries. **Do not rely on auto-save alone.**

After each assistant turn, if you produced any of the below, call **`mem_save`** (or confirm auto-save captured it):

1. **Decisions** — architecture, library choice, pattern ("use Effect.gen not async")
2. **Bugfixes** — symptom, root cause, file:line, fix one-liner
3. **Discoveries** — non-obvious API, constraint, repo convention
4. **Changes** — config keys, env vars, scripts, test commands
5. **Features** — what shipped, entry points, how to verify

### Entry format (concise bullets)

```
Title: <72 chars, searchable>
Tags: bugfix | feature | decision | discovery | change | refactor
- file/path.ts: what changed
- command: bun test … from packages/awakened
- why: one sentence
```

Prefer **project** scope; **global** only for cross-repo habits.

## 3-step recall workflow (token-efficient)

1. **mem_search** — get titles + ids (~50 tokens each)
2. **mem_list** — if search misses, scan recent same tags
3. **Apply** — only expand mentally what you need; do not paste whole journals into chat

## Tags (claude-mem style)

Use lowercase tags on `mem_save`: `bugfix`, `feature`, `decision`, `discovery`, `change`, `refactor`, plus `auto` when system already tagged.

## Commands

- `/remember` — quick-save user-stated prefs
- `/mem-search` — explicit search prompt
- `/mem` — TUI browser

## Config (`awakenedMemory`)

- `autoSave` / `autoRecall` (default on)
- `maxRecall` — injected hits per turn (default 5)

## Anti-patterns

- Saving full chat transcripts
- Skipping mem_save because "auto-save might handle it"
- Re-implementing without mem_search when prior work exists
- Duplicate entries — vary title or content slightly if updating a note

## Related skills

Load **mem-search** for search-only workflows. Pair with **self-improvement** for AGENTS.md + `/learn`.
