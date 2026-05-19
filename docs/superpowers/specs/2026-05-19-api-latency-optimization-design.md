# API Latency Optimization — Full Pipeline

**Date:** 2026-05-19
**Status:** Draft
**Scope:** Client-side latency reduction across all LLM providers

## Problem

The client experiences latency across the full API pipeline:
- **Time to first token (TTFT)** — network and connection overhead before streaming begins
- **Streaming throughput** — per-token processing overhead reduces perceived speed
- **Between-turn overhead** — sequential operations between API calls add up

## Goal

Reduce end-to-end latency by 30-50% through three complementary optimization phases, without changing external behavior.

## Design

### Phase 1: Connection & Transport Layer

**Objective:** Reduce TTFT by optimizing the network layer.

#### 1.1 Connection Pre-warming

On startup, pre-establish TCP/TLS connections to configured providers. Currently connections are lazy — first request pays the full handshake cost.

- Add `prewarmConnection()` to `src/services/api/client.ts`
- Call during init for the primary provider (after config load, before first user input)
- Health-check cached connections before sending requests (lightweight ping or connection state check)
- Lazy reconnection on first use after idle (5min timeout, configurable via env)

#### 1.2 Keep-Alive Optimization

Current behavior in `src/utils/proxy.ts:30`: `disableKeepAlive()` is sticky — once disabled, never re-enabled for the process lifetime.

New behavior:
- Time-based re-enable after ECONNRESET (30s cooldown)
- Per-provider keep-alive tracking (don't disable for all providers on one failure)
- Add `resetKeepAliveAfterCooldown()` function

#### 1.3 Proxy Agent Optimization

- Skip proxy agent entirely when no proxy configured (currently creates agent object anyway)
- Memoize proxy agent per hostname (currently memoized by full URL including query params)
- Reduce NO_PROXY check overhead for repeated URLs (add LRU cache for `shouldBypassProxy()`)

**Files to modify:**
- `src/services/api/client.ts` — connection pre-warming in `getAnthropicClient()`
- `src/utils/proxy.ts` — keep-alive management, proxy optimization
- `src/services/api/fetchWithProxyRetry.ts` — smarter retry with connection state

---

### Phase 2: Streaming & Processing Pipeline

**Objective:** Reduce per-token overhead and improve throughput.

#### 2.1 Tool Schema Caching

Current state in `src/services/api/claude.ts:113-115`:
```typescript
const _toolSchemaCache = new Map<string, unknown>()
let _toolSchemaCacheKey = ''
let _toolSchemaCacheTime = 0
```

The cache exists but the key is rebuilt from scratch every call. Optimize:
- Stable cache key from tool set hash (sort tool names, hash the set)
- Invalidate only when tools change (not every call)
- Pre-compute schemas at tool registration time in `src/Tool.ts`

#### 2.2 Message Normalization Optimization

Current: `normalizeMessagesForAPI()` in `src/utils/messages.ts` processes the entire message history each turn.

New: incremental normalization:
- Track which messages have been normalized
- Only normalize new messages since last turn
- Cache normalized form of historical messages
- Invalidate cache on compact/interruption

#### 2.3 Streaming Chunk Batching

Current: each streaming chunk triggers an Ink re-render.

Optimize:
- Batch chunks into 16ms windows (one frame at 60fps)
- Adaptive batching: fast arrival = batch, slow arrival = immediate
- Track batch stats for monitoring

**Files to modify:**
- `src/services/api/claude.ts` — tool schema cache optimization
- `src/utils/messages.ts` — incremental normalization
- `src/services/api/openaiShim.ts` — shim-level streaming optimization
- `src/QueryEngine.ts` — chunk batching for rendering

---

### Phase 3: Request Pipeline Parallelization

**Objective:** Reduce between-turn overhead by parallelizing independent operations.

#### 3.1 Parallel Tool Execution

Current: `runTools()` in `src/services/tools/toolOrchestration.ts` executes tools sequentially.

New: parallel execution for independent tools:
- Classify tools as read-only vs write (already exists via `isReadOnly()`)
- Execute read-only tools in parallel
- Maintain sequential order for write tools
- Tool dependency graph for complex scenarios

#### 3.2 Auth Token Pre-fetch

Current: OAuth token refresh is reactive — checked before each request in `getAnthropicClient()`.

New: background refresh:
- Monitor token lifetime
- Refresh when token is 80% through its lifetime
- Pre-fetch credentials for all configured providers
- Non-blocking — don't delay requests for pre-fetch

#### 3.3 Context Building Optimization

Current: full system prompt assembly each turn in `src/constants/prompts.ts`.

New:
- Cache static prompt sections (tools, system instructions)
- Only rebuild dynamic parts (context, attachments, skills)
- Lazy loading of non-critical prompt sections
- Memoize `getSystemPrompt()` with invalidation on config change

**Files to modify:**
- `src/services/tools/toolOrchestration.ts` — parallel execution
- `src/services/api/client.ts` — auth pre-fetch
- `src/constants/prompts.ts` — prompt section caching
- `src/query.ts` — context building optimization

---

## Implementation Order

1. **Phase 1** — Transport layer (lowest risk, broadest impact)
2. **Phase 3** — Pipeline parallelization (highest between-turn impact)
3. **Phase 2** — Streaming optimization (requires careful tuning)

## Success Criteria

- TTFT reduced by 20-30% across providers
- Between-turn overhead reduced by 40-50%
- No behavior changes — all optimizations are internal
- All existing tests pass
- No regressions in error handling or retry logic

## Risks

- **Connection pre-warming** — may increase startup time slightly
- **Keep-alive re-enable** — must handle edge cases where connection is truly dead
- **Parallel tool execution** — must maintain ordering for side-effect tools
- **Chunk batching** — too aggressive batching adds latency

## Testing

- Unit tests for each optimization
- Integration tests for provider-specific behavior
- Latency benchmarks (TTFT, throughput, between-turn)
- Manual testing with each provider type
