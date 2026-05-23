# AWK3N3D Agent Orchestration

**Purpose:** Define how the main agent dispatches work to specialized job personas.

**Reference architecture:** [Code Abyss](https://github.com/telagod/code-abyss) (composable identity + behavior + skills)

---

## Agent Tool vs Cursor Task

| Feature | OpenClaude `Agent` | Cursor `Task` |
|---------|-------------------|---------------|
| **Dispatch** | By job type (`subagent_type`) | Generic explore |
| **Personas** | 7 specialized roles | Single general agent |
| **Tool restrictions** | Per-agent allowlist | No restrictions |
| **Output** | Compressed (caveman ultra) | Verbose |
| **Context** | Injected back to main | Separate thread |

**Use `Agent` tool for job-based dispatch. Cursor `Task` not available in OpenClaude.**

---

## Job Persona Roster

| `subagent_type` | Job | Personality | Tools | When to Use |
|----------------|-----|-------------|-------|-------------|
| `scout` | Explore / locate | Terse analyst | Read, Glob, Grep, ToolSearch | "Where is X?", "Find callers", "Map dependencies" |
| `architect` | Design / plan | Principal engineer | Read, Glob, Grep, Skill | "How should we build X?", "Trade-offs for A vs B?" |
| `builder` | Implement / fix | Pragmatic craftsperson | Read, Edit, Write, Glob, Grep | "Fix bug", "Add function", "Implement feature (1-2 files)" |
| `reviewer` | PR / diff audit | Skeptical reviewer | Read, Grep, Glob | "Review this PR", "Audit changes", "Check diff" |
| `security-auditor` | Security review | AppSec lead | Read, Grep, Glob | "Security review", "Audit auth flow", "Check for secrets" |
| `doc-writer` | Docs / plans / ADRs | Technical writer | Read, Write, Edit, Glob | "Write README", "Create plan", "Document API" |
| `verifier` | Post-change validation | Neutral QA | Read, Bash, Grep | "Verify changes", "Run checks", "Validate build/test/lint" |

**Full specs:** `.claude/agents/*.md`  
**Routing logic:** `.claude/skills/awk3nd-router/SKILL.md`

---

## Dispatch Rules

### Before Large Work: Classify Job

**Main agent workflow:**
1. Parse user request
2. Load `/awk3nd-router` skill
3. Match trigger phrases → pick `subagent_type`
4. Spawn via `Agent` tool with clear prompt
5. Wait for subagent result
6. Decide next action

**Example:**
```
User: "Add JWT auth to /api/* routes"
Main: Load /awk3nd-router
Main: Match "Add" → job = implement
Main: Spawn Agent(subagent_type="architect", prompt="Design JWT auth for /api/*")
Architect: Returns design doc + file list
Main: Spawn Agent(subagent_type="builder", prompt="Implement per design: [file list]")
Builder: Returns changed file:line list
Main: Spawn Agent(subagent_type="verifier", prompt="Validate changes")
Verifier: Returns pass/fail
Main: Report to user "Done. Pushed commit abc123."
```

### Never Duplicate Scout Work After Delegating

**Anti-pattern:**
```
Main: Spawn scout to find X
Scout: Returns file:line matches
Main: Re-searches for X (duplicate work)
```

**Correct:**
```
Main: Spawn scout to find X
Scout: Returns file:line matches
Main: Use scout results directly (no re-search)
```

### Never Let Builder Run Security Sign-Off

**Anti-pattern:**
```
Main: Spawn builder to add auth
Builder: Implements + self-reviews security
```

**Correct:**
```
Main: Spawn builder to add auth
Builder: Implements only
Main: Spawn security-auditor to review
Security-auditor: Returns threat list
Main: Spawn builder to fix threats (if any)
```

---

## Parallel Execution

**Independent jobs → spawn parallel:**
```typescript
// User: "Find all TODO comments and list test files"
await Promise.all([
  Agent({ subagent_type: "scout", prompt: "Find all TODO comments" }),
  Agent({ subagent_type: "scout", prompt: "List test files" })
])
```

**Sequential dependency → chain:**
```typescript
// User: "Design + implement feature X"
const design = await Agent({ subagent_type: "architect", prompt: "Design X" })
const impl = await Agent({ subagent_type: "builder", prompt: `Implement: ${design}` })
```

---

## Integration with Superpowers

### `/make-plan`

**Trigger:** User requests multi-step feature or complex task.

**Workflow:**
1. Main agent calls `/make-plan` skill
2. Plan created in `docs/superpowers/plans/`
3. Main agent executes plan ONE task at a time
4. Each task may spawn subagents
5. Verify before marking task complete

**Plans:**
- `docs/superpowers/plans/2026-05-22-ecosystem-agentic-upgrade.md` (this plan)
- `docs/superpowers/plans/2026-05-22-ai-tools-productivity.md` (tools plan)

### `/cavecrew`

**Alternative to vanilla `Agent` tool.**

**Benefits:**
- Compressed output (~60% smaller)
- Caveman-style subagents (investigator, builder, reviewer)
- Main context lasts longer

**When to use:**
- Context budget tight
- Long sessions (>100k tokens used)
- User explicitly requests `/cavecrew`

**Decision guide:** `.agents/skills/cavecrew/SKILL.md`

### `/verify`

**Wrapper around `verifier` agent.**

**Trigger:** After 3+ file edits, before push, or user requests.

**Workflow:**
1. Main agent spawns `verifier`
2. Verifier runs: build, type-check, lint, tests, link
3. Verifier reports pass/fail
4. If fail → main spawns `builder` to fix → re-verify
5. If pass → mark task complete

---

## Shared Behavior

**All subagents follow:** `.claude/rules/persona-behavior.md`

**Iron Laws:**
1. One plan checkbox per session
2. Subagents do not spawn subagents
3. Read-only agents never edit
4. Verifier required before "done" (3+ files)
5. Prefer dedicated tools over Bash

**Execution chains:** See persona-behavior.md

---

## Output Format

**Subagent → Main:**
```
[Job] done. [Result summary]. [Next action recommendation].
```

**Main → User:**
```
Task X done. Changed: [file:line summary]. Build OK. Pushed [commit]. Next: Task Y?
```

**Caveman ultra mode active for all agents.**

---

## Graphify Integration

**Graphify = Cursor-specific skill (not in OpenClaude).**

**Location:** `~/.cursor/skills-cursor/graphify/`

**Trigger:** `/graphify` in Cursor IDE only.

**OpenClaude equivalent:** Use `scout` agent for code exploration, then manual visualization if needed.

---

## Code Abyss Reference

**Repo:** https://github.com/telagod/code-abyss  
**Tech Persona Card spec:** https://github.com/telagod/code-abyss/blob/main/docs/specs/tech-persona-card-v1.0.md

**AWK3N3D uses Code Abyss structure (identity + behavior + skills) in English for engineering jobs.**

**Persona cards:** `.claude/personas/*/persona-card.json` (portable, Tech Persona Card v1.0 format)

---

## Anti-Patterns

| Anti-Pattern | Why Blocked | Correct Action |
|--------------|-------------|----------------|
| Generic "explore" dispatch | Wastes context | Use job-specific `subagent_type` |
| Builder reviews own diff | Bias, miss issues | Spawn `reviewer` separately |
| Skip verifier on 3+ files | Catch failures late | Always verify before "done" |
| Spawn subagent for single Read | Overhead | Main agent uses Read directly |
| Verbose subagent output | Context explosion | Caveman ultra enforced |

---

## Updates

**When to update:**
- New agent added → update roster table
- New workflow pattern → add to examples
- New anti-pattern discovered → add to table

**How to update:**
1. Edit this file
2. Commit: `docs: update AGENTS.md`
3. Restart session to reload
