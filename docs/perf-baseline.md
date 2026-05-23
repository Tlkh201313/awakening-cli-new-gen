# Performance Baseline — Phase 0

**Date:** 2026-05-23  
**Machine:** Windows (win32)  
**Setup:** Cloud APIs (Anthropic), no local GPU inference

---

## Benchmark Results

### Logo Animation
- **Animated:** 208ms
- **Fast (return visit):** 0ms
- **Savings potential:** ~200ms on cold start

### Stream Throttle
- **Coalesced runs:** 2 (target: ≤2 per 50 deltas)
- **Status:** ✓ Optimal

### Platform
- **OS:** win32
- **Terminal:** Windows Terminal (recommended) vs conhost (legacy)

---

## MCP Server Inventory

### Project Config (`.mcp.json`)
- **Count:** 1 server
- **Servers:**
  - `mcp-obsidian` (HTTP, localhost:27123, needs auth)

### User Config (`~/.claude/settings.json`)
- **Count:** Unknown (requires REPL inspection)
- **Potential issue:** Multi-minute startup if many MCP processes connect

### Plugin MCP
- **Enabled plugins:** 4 (superpowers, caveman, claude-mem, morph-compact)
- **Disabled plugins:** 8 (voltagent, ruflo, antigravity, everything-claude-code, codex)
- **MCP servers from plugins:** Unknown (requires `/mcp` in REPL)

---

## Startup Profile Checkpoints

**Key checkpoints (from `src/main.tsx`):**

| Checkpoint | Line | Description |
|------------|------|-------------|
| `main_tsx_entry` | 12 | Entry before heavy module eval |
| `main_tsx_imports_loaded` | 214 | After all imports |
| `eagerLoadSettings_start` | 512 | Settings load start |
| `eagerLoadSettings_end` | 524 | Settings load end |
| `before_connectMcp` | 2755 | Before MCP connection |
| `after_connectMcp` | 2757 | After MCP connection |
| `action_after_plugins_init` | 2587 | After plugin init |
| `main_after_run` | 4537 | Final checkpoint |

**To measure:**
```powershell
$env:CLAUDE_CODE_PROFILE_STARTUP = "1"
awakened
# Check output for checkpoint times
```

**Expected output location:** Console or `~/.claude/startup-profile.txt`

---

## Interactive Session Checklist

**Measured times (manual):**

| Metric | Time | Notes |
|--------|------|-------|
| Cold start → first keystroke | TBD | Requires REPL test |
| First message → first token | TBD | Cloud API latency |
| Heavy tool turn (large `rg`) | TBD | CPU-bound search |
| Streaming jank | TBD | Windows Terminal vs conhost |

**Action required:** User must run interactive session and record times.

---

## Pain Area Ranking (Hypothesis)

Based on code inspection + benchmark:

1. **MCP connection** — Likely #1 killer if many servers enabled
   - Evidence: Comments in `main.tsx` cite multi-minute startup
   - Mitigation: Disable unused MCP servers, defer optional servers

2. **Startup imports** — 208ms logo + unknown import time
   - Evidence: Eager imports in `main.tsx` + `commands.ts`
   - Mitigation: Lazy command load, skip Ollama prefetch on cloud

3. **Streaming UI** — Already optimized (2 coalesced runs)
   - Evidence: Benchmark shows optimal throttle
   - Mitigation: Verify Windows Terminal in use, not conhost

4. **Cloud latency** — Provider-bound, not CLI-bound
   - Evidence: No local GPU, cloud APIs only
   - Mitigation: Nearest region, smaller context, fewer tools

---

## Top Checkpoint (Hypothesis)

**Predicted slowest:** `before_connectMcp` → `after_connectMcp`

**Why:** MCP process spawn + handshake dominates startup when multiple servers enabled.

**Verification:** Run `CLAUDE_CODE_PROFILE_STARTUP=1 awakened` and inspect delta.

---

## Phase Ordering (Recommended)

Based on hypothesis:

1. **Phase 1** — Quick wins (perf mode, skip logo, Windows Terminal)
2. **Phase 2** — Startup (MCP defer, lazy commands, skip Ollama prefetch)
3. **Phase 3** — Streaming UI (already optimal, verify only)
4. **Phase 4** — Cloud latency (tool catalog diet, connection reuse)
5. **Phase 5** — Tools (parallel rg, already optimal)
6. **Phase 6** — GPU docs (fix expectations, no code change)

---

## Phase 1 — Quick Wins (Complete)

| Change | File | Savings |
|--------|------|---------|
| Perf mode: 4 cores or Windows (was 6+) | `awakenedPerformance.ts` | Auto-enable on more machines |
| Logo skip in perf mode | `StartupScreen.ts` | ~200ms on return visits |
| Ollama prefetch gated on OpenAI | `main.tsx` | Skip on cloud-only setups |
| Windows Terminal detection | `terminal.ts` | Better UX guidance |
| GPU/CPU clarity | `README.md` | Correct expectations |

## Phase 2 — Structural (Already Exists)

| Feature | Status | Evidence |
|---------|--------|----------|
| Lazy command loading | ✓ Done | All heavy commands use `load: () => import('./...')` |
| Non-blocking MCP (REPL) | ✓ Done | Line 2473: "MCP never blocks REPL render OR turn 1 TTFT" |
| Stream throttle | ✓ Optimal | 2 coalesced runs (benchmark) |
| Ollama prefetch gate | ✓ Done | Phase 1: gated on `CLAUDE_CODE_USE_OPENAI` |

**Conclusion:** Structural optimizations already baked in. Further gains require profiling data.

---

## Next Steps

1. **User:** Run `$env:CLAUDE_CODE_PROFILE_STARTUP = "1"; awakened` in REPL
2. **User:** Record checkpoint deltas (especially MCP connection)
3. **User:** Fill in interactive session checklist times
4. **Agent:** Phase 3+ only if profiling reveals specific bottleneck

---

## Notes

- **GPU irrelevant:** Cloud APIs do not use local GPU
- **CPU usage:** I/O thread pool + UI throttle (not inference)
- **Benchmark optimal:** Stream coalescing already at target (2 runs)
- **MCP risk:** Unknown user-level MCP count (requires REPL)
