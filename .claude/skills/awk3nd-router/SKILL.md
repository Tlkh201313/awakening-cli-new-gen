---
name: awk3nd-router
description: Job-to-subagent routing table for AWK3N3D project. Maps user requests to specialized agents.
---

# AWK3N3D Router

**USE WHEN:** Main agent needs to classify a job and pick the right `subagent_type`.

**DO NOT USE FOR:** Direct task execution (routing only).

---

## Routing Table

| User Request Pattern | Job | `subagent_type` | Why |
|---------------------|-----|----------------|-----|
| "Where is X?", "Find callers of Y", "Show files matching Z" | Explore / locate | `scout` | Read-only search specialist |
| "How should we build X?", "Design solution for Y", "Trade-offs for A vs B?" | Design / plan | `architect` | Principal engineer, no drive-by edits |
| "Fix bug in X", "Add function Y", "Implement feature Z (1-2 files)" | Implement / fix | `builder` | Surgical edits, minimal diff |
| "Review this PR", "Audit changes", "Check diff for issues" | PR / diff audit | `reviewer` | Skeptical reviewer, findings only |
| "Security review for X", "Audit auth flow", "Check for secrets" | Security audit | `security-auditor` | Threat-focused, no exploits |
| "Write README", "Create plan", "Document API", "Add ADR" | Docs / plans | `doc-writer` | Structure over prose |
| "Verify changes", "Run checks", "Validate build/test/lint" | Post-change validation | `verifier` | Neutral QA, pass/fail only |

---

## Trigger Phrases

### Scout
- "where is"
- "find"
- "show me"
- "list all"
- "search for"
- "locate"
- "map dependencies"
- "architecture"

### Architect
- "how should we"
- "design"
- "trade-offs"
- "approach"
- "refactor scope"
- "what's the best way"
- "options for"

### Builder
- "fix"
- "add"
- "implement"
- "create function"
- "update"
- "change"
- "modify"

### Reviewer
- "review"
- "audit"
- "check"
- "validate"
- "inspect"
- "diff"

### Security Auditor
- "security"
- "threat"
- "vulnerability"
- "secrets"
- "auth flow"
- "injection"
- "XSS"

### Doc Writer
- "write"
- "document"
- "README"
- "plan"
- "ADR"
- "comment"
- "explain"

### Verifier
- "verify"
- "test"
- "build"
- "lint"
- "type check"
- "validate"
- "run checks"

---

## Anti-Patterns (DO NOT Route)

| Request | Wrong Agent | Right Action |
|---------|-------------|--------------|
| "Review this PR" | `builder` | Use `reviewer` (no edits during review) |
| "Find where X is used" | `builder` | Use `scout` (read-only search) |
| "Fix security issue" | `security-auditor` | Use `builder` (auditor reports, builder fixes) |
| "Design + implement feature" | `builder` | Split: `architect` → design, then `builder` → implement |
| "Explore codebase" | `verifier` | Use `scout` (verifier = post-change only) |

---

## Multi-Agent Workflows

### Feature Development
1. **User:** "Add JWT auth to /api/* routes"
2. **Main → architect:** Design auth middleware
3. **Architect returns:** Design doc + file list
4. **Main → builder:** Implement per design (3 files)
5. **Builder returns:** Changed file:line list
6. **Main → security-auditor:** Audit auth flow
7. **Security-auditor returns:** Threat list (if any)
8. **Main → builder:** Fix threats (if any)
9. **Main → verifier:** Run build/test/lint
10. **Verifier returns:** Pass/fail
11. **Main → user:** "Done. Pushed commit abc123."

### Bug Fix
1. **User:** "Fix null pointer in src/auth.ts:42"
2. **Main → scout:** Find all callers of buggy function
3. **Scout returns:** Caller list
4. **Main → builder:** Fix bug + update callers
5. **Builder returns:** Changed file:line list
6. **Main → verifier:** Run tests
7. **Verifier returns:** Pass
8. **Main → user:** "Fixed. Tests pass."

### Security Audit
1. **User:** "Security review for auth module"
2. **Main → security-auditor:** Audit src/auth/*
3. **Security-auditor returns:** Threat list
4. **Main → builder:** Fix CRITICAL threats
5. **Builder returns:** Changed file:line list
6. **Main → verifier:** Run tests
7. **Verifier returns:** Pass
8. **Main → user:** "Fixed 3 threats. WARN items in backlog."

---

## Parallel Dispatch

**Independent jobs → spawn parallel:**
```
User: "Find all TODO comments and list test files"
Main spawns:
  - scout (task="find TODO comments")
  - scout (task="list test files")
Both return → main merges results
```

**Sequential dependency → chain:**
```
User: "Design + implement feature X"
Main spawns:
  - architect (task="design X") → waits for result
  - builder (task="implement per design") → uses architect output
```

---

## Integration with Orchestrator

**Main agent workflow:**
1. Load `/awk3nd-router` skill
2. Parse user request
3. Match trigger phrases → pick `subagent_type`
4. Spawn via `Agent` tool with clear prompt
5. Wait for subagent result
6. Decide next action (spawn another, report to user, verify)

**Orchestrator skill (`/awk3nd-orchestrator`) uses this router for all delegations.**

---

## Code Abyss Integration (Optional)

**If Code Abyss plugin installed:**
- Code Abyss provides 24 domain skills (Rust, web, CLI, etc.)
- **Replace** Code Abyss default literary personas with AWK3N3D job roster
- Keep Code Abyss domain skills, use AWK3N3D routing

**Action if Code Abyss detected:**
1. Disable Code Abyss persona agents
2. Enable Code Abyss domain skills only
3. Use AWK3N3D router for all job dispatch

**No Code Abyss = AWK3N3D router only.**

---

## Output Format

**Router does NOT execute tasks.** It only provides routing logic to main agent.

**Main agent uses router internally, never outputs routing table to user.**
