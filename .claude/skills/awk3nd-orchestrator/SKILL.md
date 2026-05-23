---
name: awk3nd-orchestrator
description: High-level dispatch for AWK3N3D project work. Routes tasks to specialized subagents, enforces verification workflow, and manages multi-phase plans.
---

# AWK3N3D Orchestrator

**USE WHEN:** Starting multi-step features, coordinating subagents, or executing plan tasks from `docs/superpowers/plans/`.

**DO NOT USE FOR:** Single-file edits, simple reads, or tasks already delegated to a subagent.

---

## Core Workflow

1. **Classify job** → pick `subagent_type` from roster (see Task 10 in ecosystem plan)
2. **Delegate** → spawn via `Agent` tool with clear prompt
3. **Verify** → 3+ file edits require `verifier` subagent before "done"
4. **Report** → concise summary to user

---

## Subagent Roster (Job → Type)

| Job | `subagent_type` | When to use |
|-----|----------------|-------------|
| Find code / callers / patterns | `scout` | "Where is X?", architecture map |
| Design / plan / refactor scope | `architect` | Trade-offs, boundaries, no drive-by edits |
| Implement / fix (1-2 files) | `builder` | Surgical edits, minimal diff |
| PR / diff audit | `reviewer` | Post-change review only |
| Security review | `security-auditor` | Threat-focused, no exploit steps |
| Docs / plans / ADRs | `doc-writer` | README, plans, comments |
| Post-change verification | `verifier` | Rerun commands, no new features |

---

## Anti-Patterns

- ❌ Duplicate scout work after delegating
- ❌ Let builder run security sign-off
- ❌ Skip verifier on 3+ file edits
- ❌ Spawn subagent for single `Read` or `Grep`

---

## Plan Execution

**Both plans in `docs/superpowers/plans/`:**
- `2026-05-22-ecosystem-agentic-upgrade.md` (this plan)
- `2026-05-22-ai-tools-productivity.md` (tools plan)

**Rule:** ONE checkbox per session → verify → STOP → next checkbox only.

**Verification before "done":**
- Build passes (`npm run build`)
- Link global (`npm link`)
- Push to GitHub
- Report completion

---

## Parallel Execution

Spawn multiple subagents in one message when tasks are independent:
- `scout` + `scout` (different modules)
- `builder` + `builder` (different files)
- `reviewer` + `security-auditor` (independent audits)

**Never parallel:** `builder` → `verifier` (sequential dependency)

---

## Integration with Superpowers

- `/make-plan` → create plan from user request
- `/cavecrew` → compressed subagent output (saves context)
- `/verify` → post-change validation loop

---

## Output Format

**Caveman ultra mode active.** Report format:

```
Task X done. Changed: file1.ts:42 (added auth), file2.ts:15 (fixed type).
Build OK. Pushed 39d38c4. Next: Task Y?
```

No fluff. No "I will". Action → result → next step.
