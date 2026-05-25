# Awakened Subagents

Inspired by [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) — curated native subagents, preinstalled in Awakened.

Invoke Skill `awakened-subagents` or run `/awakened-subagents`.

## Non-negotiable

The parent agent **must dispatch** work with the **task tool** (`subagent_type`). Do not hoard exploration, review, multi-file implementation, or verification inline when a subagent fits.

Launch **parallel** `task` calls when subtasks are independent (one message, multiple tool uses).

## Routing

| If the work is… | subagent_type |
|-----------------|---------------|
| Multi-step / mixed domains | **orchestrator** |
| Find code / map repo | **explore** |
| External docs / deps | **scout** |
| Design before coding | **architect** |
| Implement 2+ files | **builder** |
| TypeScript typing/refactor | **typescript-pro** |
| UI/components | **frontend-developer** |
| Tests failing / CI red | **debugger** or **test-automator** |
| Review diff/PR | **reviewer** |
| Security-sensitive change | **security-auditor** |
| Docs only | **writer** |
| After 3+ file edits | **verifier** |

## Multi-file edits

Subagents **builder**, **typescript-pro**, and **frontend-developer** must batch changes:

- Prefer **apply_patch** with multiple file sections in one call when available
- Otherwise parallel **edit/write** tool calls in the same turn

## Verify ladder

After implementation: **verifier** or run build → typecheck → lint → targeted tests (from AGENTS.md).

## Memory

Use **mem_search** before reversing prior decisions. Save durable notes with **mem_save** or `/remember`.

## Catalog source

Full upstream catalog: `VoltAgent/awesome-claude-code-subagents` (131+ agents). Awakened ships a focused native set; install more via `.awakened/agents/*.md` if needed.
