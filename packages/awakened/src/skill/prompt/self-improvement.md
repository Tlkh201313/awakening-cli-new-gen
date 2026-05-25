# Self-Improvement Playbook

Make the agent smarter on the **next** session — scoped `AGENTS.md`, memory, and learnings.

## When to use

Session wrap-up, after debugging breakthroughs, when the user says "remember this for next time", or before ending multi-step work.

## Commands

- **`/init`** — create or refresh project `AGENTS.md` from the repo
- **`/learn`** — distill non-obvious discoveries from the current session into scoped `AGENTS.md` files
- **`/remember`** — persist user preferences via awakened-memory
- Load **`awakened-mem`** — save decisions/bugfixes every turn; **`mem-search`** before redoing prior work

## Process (`/learn` or manual)

1. Review the session for surprises: wrong assumptions, multi-attempt fixes, hidden coupling
2. Pick scope — root vs package vs feature directory
3. Read existing `AGENTS.md` at that level; do not duplicate
4. Add 1–3 line bullets; commit with the related code when possible

## Memory vs AGENTS.md

| Store in | Examples |
|----------|----------|
| `AGENTS.md` | Repo layout, test commands, conventions, "files that change together" |
| `mem_save` / `/remember` | User prefs, API keys locations (not values), cross-repo habits |

## Upstream (optional)

- [obra/superpowers](https://github.com/obra/superpowers) — finishing branches, verification before completion
- [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) — capture/reflect productivity skills

## Related

- **Awakened Memory** capability — auto recall/save
- **customize-awakened** — config-only edits
