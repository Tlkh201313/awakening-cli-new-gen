# Superpowers Plans

**Location:** `docs/superpowers/plans/`

**Purpose:** Track multi-phase project work with verification checkpoints.

---

## Active Plans

| Plan | Status | Next Task | Updated |
|------|--------|-----------|---------|
| [Ecosystem & Agentic Upgrade](2026-05-22-ecosystem-agentic-upgrade.md) | In Progress | Task 11 (CLAUDE.md + AGENTS.md) | 2026-05-23 |
| [AI Tools Productivity](2026-05-22-ai-tools-productivity.md) | Pending | Task 1 | 2026-05-22 |

---

## Execution Rules

### ONE Checkbox Per Session

**Rule:** Execute ONE task → verify → STOP → report completion.

**Why:** Prevents context explosion, ensures verification before next task.

**Workflow:**
1. Read plan task
2. Execute task (may spawn subagents)
3. Verify (build, test, lint)
4. Mark checkbox complete
5. Commit + push
6. Report to user
7. **STOP** (do not continue to next task)

### Parallel Plans

**Both plans can run in parallel.**

**Coordination required when:**
- Both edit same file (e.g., `src/constants/prompts.ts`)
- Shared dependencies (e.g., plugin system)

**Coordination protocol:**
1. Check other plan's current task
2. If conflict → pause, coordinate with user
3. If no conflict → proceed independently

---

## Plan Format

**Required sections:**
- Goal (one-line)
- Sequential execution rule
- Phase breakdown
- Task checklist
- Verification criteria
- Final verification

**Task format:**
```markdown
### Task N: Description

**What:** Action to take

**Verification:**
- [ ] Criterion 1
- [ ] Criterion 2
```

---

## Verification Before "Done"

**Mandatory for all tasks:**
1. Build passes (`npm run build`)
2. Link global (`npm link`)
3. Push to GitHub
4. Report completion

**Additional for code tasks:**
- Type check passes (`npx tsc --noEmit`)
- Lint passes (`eslint --max-warnings 0`)
- Tests pass (`npm test`)

---

## Creating New Plans

**Trigger:** User requests multi-step feature or complex task.

**Workflow:**
1. Main agent calls `/make-plan` skill
2. Plan created in this directory
3. Filename: `YYYY-MM-DD-<slug>.md`
4. Add to table above
5. Execute first task

**Template:**
```markdown
# Plan Title

**Goal:** One-line goal

## Sequential execution rule

ONE checkbox per session → verify → STOP → next checkbox only.

## Phase 1: Name

### Task 1: Description

**What:** Action

**Verification:**
- [ ] Criterion

## Final verification

- [ ] All tasks complete
- [ ] Build passes
- [ ] Tests pass
```

---

## Completed Plans

**Archive:** Move to `docs/superpowers/plans/archive/` when all tasks done.

**Retention:** Keep for reference, link from main docs.

---

## Integration with Agents

**Main agent uses plans for:**
- Task sequencing
- Verification checkpoints
- Progress tracking

**Subagents never:**
- Read plans directly (main agent extracts task)
- Mark checkboxes (main agent marks after verification)
- Continue to next task (one task per spawn)

---

## Updates

**When to update this README:**
- New plan created → add to table
- Plan completed → move to archive, update table
- Plan status changed → update "Next Task" column

**How to update:**
1. Edit this file
2. Commit: `docs: update plans README`
3. Push to GitHub
