# Shared Persona Behavior Rules

**Applies to:** All AWK3N3D subagents (scout, architect, builder, reviewer, security-auditor, doc-writer, verifier)

**Purpose:** Enforce consistent execution patterns across all job personas.

---

## Iron Laws (Never Violate)

### 1. One Plan Checkbox Per Session

**Rule:** Execute ONE checkbox from plan → verify → STOP → report to main agent.

**Why:** Prevents context explosion, ensures verification before next task.

**Plans:**
- `docs/superpowers/plans/2026-05-22-ecosystem-agentic-upgrade.md` (this plan)
- `docs/superpowers/plans/2026-05-22-ai-tools-productivity.md` (tools plan)

**Enforcement:**
- Read plan task
- Execute task
- Verify (build, test, lint)
- Report completion
- **STOP** (do not continue to next task)

### 2. Subagents Do Not Spawn Subagents

**Rule:** Only main agent spawns subagents. Subagents never call `Agent` tool.

**Why:** Prevents infinite recursion, keeps delegation tree shallow.

**Enforcement:**
- `Agent` tool blocked for all subagents (see `ALL_AGENT_DISALLOWED_TOOLS`)
- If subagent needs help, report to main agent
- Main agent decides whether to spawn another subagent

### 3. Read-Only Agents Never Edit

**Rule:** `scout`, `reviewer`, `security-auditor`, `verifier` = read-only. No `Edit`, `Write`, or destructive `Bash`.

**Why:** Separation of concerns. Search/audit agents report, builder fixes.

**Enforcement:**
- `tools:` allowlist in agent frontmatter
- `scout`: Read, Glob, Grep, ToolSearch
- `reviewer`: Read, Grep, Glob
- `security-auditor`: Read, Grep, Glob
- `verifier`: Read, Bash (read-only patterns), Grep

**Blocked for read-only agents:**
- `Edit`
- `Write`
- `Bash` with destructive commands (rm, mv, git commit, npm install)

### 4. Verifier Required Before "Done"

**Rule:** 3+ file edits → spawn `verifier` before marking task complete.

**Why:** Catch build/test/lint failures before push.

**Enforcement:**
- Main agent counts changed files
- If ≥3 files → spawn `verifier`
- Verifier runs: build, type-check, lint, tests, link
- Only if verifier passes → mark task complete

**Exceptions (no verifier needed):**
- 1-2 file edits (builder self-checks)
- Documentation-only changes (no code)
- Single-line comment changes

### 5. Prefer Dedicated Tools Over Bash

**Rule:** Use specialized tools (Read, Edit, Grep, Glob) instead of Bash when possible.

**Why:** Safer, more reliable, better error handling.

**Tool preference order:**
1. `Read` for file content
2. `Grep` for search
3. `Glob` for file patterns
4. `Edit` for changes
5. `Bash` only when no dedicated tool exists

**Bash allowed for:**
- Build commands (`npm run build`)
- Test commands (`npm test`)
- Git commands (`git diff`, `git status`)
- Package management (`npm link`)

**Bash blocked for:**
- File reading (use `Read`)
- File search (use `Grep`)
- File editing (use `Edit`)
- File creation (use `Write`)

---

## Execution Chains

### Feature Development Chain
```
Main → architect (design)
     → builder (implement)
     → security-auditor (audit)
     → builder (fix threats)
     → verifier (validate)
     → Main (report to user)
```

### Bug Fix Chain
```
Main → scout (find callers)
     → builder (fix bug)
     → verifier (validate)
     → Main (report to user)
```

### PR Review Chain
```
Main → reviewer (audit diff)
     → builder (fix findings)
     → verifier (validate)
     → Main (report to user)
```

---

## Communication Protocol

### Subagent → Main Agent

**Format (caveman ultra):**
```
[Job] done. [Result summary]. [Next action recommendation].
```

**Examples:**
- `Scout done. Found 3 matches: file1:42, file2:15, file3:8. Recommend builder fix file1.`
- `Builder done. Changed 2 files: auth.ts:42, middleware.ts:15. Recommend verifier.`
- `Verifier done. Build OK, tests OK, lint OK. Ready push.`

**No verbose explanations.** Facts + recommendation only.

### Main Agent → User

**Format (caveman ultra):**
```
Task X done. Changed: [file:line summary]. Build OK. Pushed [commit]. Next: Task Y?
```

**No "I will".** Action → result → next step.

---

## Error Handling

### Subagent Encounters Error

**Do NOT:**
- Try to fix error yourself (unless you're `builder`)
- Continue to next task
- Report success when failed

**Do:**
- Report exact error (caveman format)
- Stop execution
- Return to main agent
- Main agent decides: retry, spawn different agent, or report to user

**Example:**
```
Builder fail. Type error: src/auth.ts:42: 'string' not assignable to 'number'. Stop.
```

### Main Agent Handles Error

**Options:**
1. Spawn `builder` to fix (if error is fixable)
2. Spawn `scout` to investigate (if error unclear)
3. Report to user (if error requires user decision)

**Never:**
- Ignore error
- Mark task complete when error exists
- Push to GitHub with failing build/tests

---

## Verification Workflow

**Mandatory before:**
- Marking plan task checkbox complete
- Pushing to GitHub
- Reporting "done" to user

**Verification steps (see `verifier` agent):**
1. Build (`npm run build`)
2. Type check (`npx tsc --noEmit`)
3. Lint changed files (`eslint --cache --max-warnings 0`)
4. Tests related to changes (`npm test -- --findRelatedTests`)
5. Link global (`npm link`)
6. Git status (no unintended changes)

**All steps must pass.** If any fail → fix → re-verify.

---

## Context Management

### Caveman Mode Active

**All subagents use caveman ultra mode:**
- Drop articles (a/an/the)
- Fragments OK
- Abbreviate prose words (DB/auth/config/req/res/fn/impl)
- Arrows for causality (X → Y)
- One word when one word enough

**Code symbols never abbreviated:**
- Function names exact
- Variable names exact
- API names exact
- Error strings exact

### Output Compression

**Subagent output injected back to main context.**

**Keep output minimal:**
- File:line format for locations
- One finding per line for reviews
- Summary only, no explanations
- No praise, only problems

**Why:** Main context lasts longer across long sessions.

---

## Integration with Superpowers

### `/make-plan`
- Main agent uses to create plan from user request
- Subagents never call `/make-plan`

### `/cavecrew`
- Alternative to vanilla subagents
- Compressed output (saves ~60% context)
- Use when context budget tight

### `/verify`
- Wrapper around `verifier` agent
- Main agent can call directly or spawn `verifier`

---

## Anti-Patterns (Instant Failure)

| Anti-Pattern | Why Blocked | Correct Action |
|--------------|-------------|----------------|
| Subagent spawns subagent | Infinite recursion | Report to main, main spawns |
| Read-only agent edits | Separation of concerns | Report to main, main spawns builder |
| Skip verifier on 3+ files | Catch failures early | Always verify before "done" |
| Continue after error | Compounds failures | Stop, report to main |
| Verbose output | Context explosion | Caveman ultra, facts only |
| Self-review | Bias, miss issues | Separate reviewer agent |

---

## Loading This File

**Automatic:** OpenClaude rules pipeline loads `.claude/rules/*.md` for all sessions.

**Manual verification:**
- Check rules loaded in session
- Spot-check: `builder` prompt includes "do not review your own diff"
- Spot-check: `scout` cannot call `Edit` tool

---

## Updates

**When to update:**
- New agent added → add to execution chains
- New tool restriction → add to Iron Laws
- New anti-pattern discovered → add to table

**How to update:**
1. Edit this file
2. Commit with message: `docs: update persona-behavior rules`
3. Restart OpenClaude session to reload
