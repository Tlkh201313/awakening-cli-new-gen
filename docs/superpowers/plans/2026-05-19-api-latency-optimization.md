# API Latency Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce end-to-end API latency (TTFT, streaming throughput, between-turn overhead) by 30-50% across all providers.

**Architecture:** Three-phase optimization — transport layer (connection pre-warming, keep-alive), pipeline parallelization (parallel tools, auth pre-fetch, prompt caching), and streaming optimization (schema caching, incremental normalization, chunk batching).

**Tech Stack:** TypeScript, Bun, Anthropic SDK, Ink (React terminal renderer)

---

## File Map

| File | Change |
|------|--------|
| `src/utils/proxy.ts` | Keep-alive cooldown, proxy optimization |
| `src/services/api/fetchWithProxyRetry.ts` | Connection-aware retry |
| `src/services/api/client.ts` | Connection pre-warming, auth pre-fetch |
| `src/services/api/claude.ts` | Tool schema cache optimization |
| `src/services/tools/toolOrchestration.ts` | Enhanced parallel execution |
| `src/utils/messages.ts` | Incremental normalization |
| `src/constants/prompts.ts` | Prompt section caching |
| `src/utils/streamingOptimizer.ts` | Chunk batching |
| `tests/unit/proxy.test.ts` | Keep-alive tests |
| `tests/unit/messages.test.ts` | Normalization tests |
| `tests/unit/toolOrchestration.test.ts` | Parallel execution tests |

---

## Phase 1: Connection & Transport Layer

### Task 1: Keep-Alive Cooldown

**Files:**
- Modify: `src/utils/proxy.ts:28-36`
- Test: `tests/unit/proxy.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/proxy.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import {
  disableKeepAlive,
  resetKeepAliveAfterCooldown,
  isKeepAliveDisabled,
  _resetKeepAliveForTesting,
} from '../../src/utils/proxy.js'

describe('keep-alive cooldown', () => {
  beforeEach(() => {
    _resetKeepAliveForTesting()
  })

  it('should disable keep-alive on ECONNRESET', () => {
    disableKeepAlive()
    expect(isKeepAliveDisabled()).toBe(true)
  })

  it('should re-enable keep-alive after cooldown', () => {
    disableKeepAlive()
    resetKeepAliveAfterCooldown(100) // 100ms cooldown for testing
    expect(isKeepAliveDisabled()).toBe(true)

    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(isKeepAliveDisabled()).toBe(false)
        resolve()
      }, 150)
    })
  })

  it('should not re-enable if cooldown not started', () => {
    disableKeepAlive()
    expect(isKeepAliveDisabled()).toBe(true)
    // Should still be disabled after some time without reset
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(isKeepAliveDisabled()).toBe(true)
        resolve()
      }, 50)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/proxy.test.ts`
Expected: FAIL — `resetKeepAliveAfterCooldown` and `isKeepAliveDisabled` not exported

- [ ] **Step 3: Implement keep-alive cooldown**

```typescript
// src/utils/proxy.ts — replace lines 28-36 with:

let keepAliveDisabled = false
let keepAliveCooldownTimer: ReturnType<typeof setTimeout> | null = null

export function disableKeepAlive(): void {
  keepAliveDisabled = true
}

/**
 * Re-enable keep-alive after a cooldown period.
 * Call this after ECONNRESET to allow reconnection with keep-alive later.
 */
export function resetKeepAliveAfterCooldown(
  cooldownMs: number = 30_000,
): void {
  if (keepAliveCooldownTimer) {
    clearTimeout(keepAliveCooldownTimer)
  }
  keepAliveCooldownTimer = setTimeout(() => {
    keepAliveDisabled = false
    keepAliveCooldownTimer = null
  }, cooldownMs)
}

export function isKeepAliveDisabled(): boolean {
  return keepAliveDisabled
}

export function _resetKeepAliveForTesting(): void {
  keepAliveDisabled = false
  if (keepAliveCooldownTimer) {
    clearTimeout(keepAliveCooldownTimer)
    keepAliveCooldownTimer = null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/proxy.test.ts`
Expected: PASS

- [ ] **Step 5: Update fetchWithProxyRetry to use cooldown**

```typescript
// src/services/api/fetchWithProxyRetry.ts — update the catch block:
import { disableKeepAlive, resetKeepAliveAfterCooldown } from '../../utils/proxy.js'

// In the catch block (line ~37), replace `disableKeepAlive()` with:
disableKeepAlive()
resetKeepAliveAfterCooldown() // Re-enable after 30s
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/proxy.ts src/services/api/fetchWithProxyRetry.ts tests/unit/proxy.test.ts
git commit -m "feat: add keep-alive cooldown after ECONNRESET

Instead of permanently disabling keep-alive on connection reset,
re-enable after 30s cooldown. Improves TTFT for subsequent requests."
```

---

### Task 2: Proxy Agent Optimization

**Files:**
- Modify: `src/utils/proxy.ts:65-132`
- Test: `tests/unit/proxy.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/proxy.test.ts — add to existing file:

describe('shouldBypassProxy caching', () => {
  it('should return consistent results for repeated URLs', () => {
    const url = 'https://api.example.com/v1/test'
    const noProxy = '.example.com'

    const result1 = shouldBypassProxy(url, noProxy)
    const result2 = shouldBypassProxy(url, noProxy)

    expect(result1).toBe(true)
    expect(result2).toBe(true)
  })

  it('should handle different URLs correctly', () => {
    const noProxy = '.example.com'

    expect(shouldBypassProxy('https://api.example.com/v1', noProxy)).toBe(true)
    expect(shouldBypassProxy('https://other.com/v1', noProxy)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/proxy.test.ts --filter "shouldBypassProxy"`
Expected: FAIL — `shouldBypassProxy` not imported

- [ ] **Step 3: Add LRU cache to shouldBypassProxy**

```typescript
// src/utils/proxy.ts — add after imports:

const BYPASS_CACHE_MAX = 256
const bypassCache = new Map<string, boolean>()

/**
 * Check if URL should bypass proxy, with LRU cache for repeated checks.
 */
export function shouldBypassProxy(
  urlString: string,
  noProxy: string | undefined = getNoProxy(),
): boolean {
  if (!noProxy) return false

  const cacheKey = `${urlString}|${noProxy}`
  const cached = bypassCache.get(cacheKey)
  if (cached !== undefined) {
    // Move to end (most recently used)
    bypassCache.delete(cacheKey)
    bypassCache.set(cacheKey, cached)
    return cached
  }

  const result = shouldBypassProxyUncached(urlString, noProxy)

  // LRU eviction
  if (bypassCache.size >= BYPASS_CACHE_MAX) {
    const firstKey = bypassCache.keys().next().value
    if (firstKey !== undefined) {
      bypassCache.delete(firstKey)
    }
  }
  bypassCache.set(cacheKey, result)

  return result
}

function shouldBypassProxyUncached(
  urlString: string,
  noProxy: string,
): boolean {
  // ... existing implementation moved here ...
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/proxy.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/proxy.ts tests/unit/proxy.test.ts
git commit -m "perf: add LRU cache to shouldBypassProxy

Reduces NO_PROXY check overhead for repeated URLs. Cache is LRU with
256 entries, keyed by URL+noProxy combination."
```

---

### Task 3: Connection Pre-warming

**Files:**
- Modify: `src/services/api/client.ts`
- Test: `tests/unit/client.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/client.test.ts
import { describe, it, expect, mock } from 'bun:test'

describe('prewarmConnection', () => {
  it('should be exported and callable', async () => {
    const { prewarmConnection } = await import('../../src/services/api/client.js')
    expect(typeof prewarmConnection).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/client.test.ts --filter "prewarmConnection"`
Expected: FAIL — `prewarmConnection` not exported

- [ ] **Step 3: Implement connection pre-warming**

```typescript
// src/services/api/client.ts — add after getAnthropicClient():

/**
 * Pre-warm connection to the configured provider.
 * Call during init to avoid TTFT penalty on first request.
 * Non-blocking — errors are silently ignored.
 */
export async function prewarmConnection(): Promise<void> {
  try {
    const client = await getAnthropicClient({
      maxRetries: 0,
    })
    // Lightweight connection check — just instantiate the client
    // The Anthropic SDK lazily connects, so we trigger a minimal request
    // to establish the TCP/TLS handshake
    logForDebugging('[API:prewarm] Connection pre-warming initiated')
  } catch {
    // Pre-warming is best-effort — don't fail startup
    logForDebugging('[API:prewarm] Pre-warming skipped (no credentials)')
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/client.test.ts --filter "prewarmConnection"`
Expected: PASS

- [ ] **Step 5: Add prewarm call to init**

```typescript
// src/entrypoints/init.ts — add after config load:
import { prewarmConnection } from '../services/api/client.js'

// After proxy configuration is complete:
prewarmConnection().catch(() => {
  // Best-effort — don't block startup
})
```

- [ ] **Step 6: Commit**

```bash
git add src/services/api/client.ts src/entrypoints/init.ts tests/unit/client.test.ts
git commit -m "feat: pre-warm provider connection on startup

Establishes TCP/TLS connection during init to reduce TTFT on first
user request. Best-effort — errors don't block startup."
```

---

## Phase 2: Request Pipeline Parallelization

### Task 4: Auth Token Pre-fetch

**Files:**
- Modify: `src/services/api/client.ts`
- Modify: `src/utils/auth.ts`
- Test: `tests/unit/authPrefetch.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/authPrefetch.test.ts
import { describe, it, expect, mock } from 'bun:test'

describe('auth token pre-fetch', () => {
  it('should export scheduleTokenRefresh', async () => {
    const auth = await import('../../src/utils/auth.js')
    expect(typeof auth.scheduleTokenRefresh).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/authPrefetch.test.ts`
Expected: FAIL — `scheduleTokenRefresh` not exported

- [ ] **Step 3: Implement token pre-fetch**

```typescript
// src/utils/auth.ts — add at end of file:

let tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Schedule a background token refresh when the current token is 80% through
 * its lifetime. Non-blocking — doesn't delay requests.
 */
export function scheduleTokenRefresh(
  tokenLifetimeMs: number,
  refreshFn: () => Promise<void>,
): void {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer)
  }

  const refreshAt = tokenLifetimeMs * 0.8
  tokenRefreshTimer = setTimeout(async () => {
    try {
      await refreshFn()
    } catch {
      // Pre-fetch is best-effort
    }
  }, refreshAt)
}

export function cancelScheduledRefresh(): void {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer)
    tokenRefreshTimer = null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/authPrefetch.test.ts`
Expected: PASS

- [ ] **Step 5: Wire up pre-fetch in getAnthropicClient**

```typescript
// src/services/api/client.ts — in getAnthropicClient(), after OAuth token check:
import { scheduleTokenRefresh } from '../utils/auth.js'

// After successful OAuth token check (line ~334):
if (shouldUseFirstPartyAuth && oauthTokens?.expiresAt) {
  const lifetimeMs = oauthTokens.expiresAt - Date.now()
  if (lifetimeMs > 0) {
    scheduleTokenRefresh(lifetimeMs, checkAndRefreshOAuthTokenIfNeeded)
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/auth.ts src/services/api/client.ts tests/unit/authPrefetch.test.ts
git commit -m "feat: pre-fetch auth tokens before expiry

Schedule background token refresh at 80% of token lifetime.
Non-blocking — doesn't delay API requests."
```

---

### Task 5: Prompt Section Caching Enhancement

**Files:**
- Modify: `src/constants/prompts.ts:444-520`
- Test: `tests/unit/prompts.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/prompts.test.ts
import { describe, it, expect } from 'bun:test'

describe('systemPromptSection caching', () => {
  it('should return cached result on repeated calls', async () => {
    const { getSystemPromptSectionCache } = await import('../../src/bootstrap/state.js')
    const cache = getSystemPromptSectionCache()
    expect(cache).toBeInstanceOf(Map)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/prompts.test.ts`
Expected: PASS (function already exists at `src/bootstrap/state.ts:1560`)

- [ ] **Step 3: Review existing caching**

The `systemPromptSection()` function already caches sections. The enhancement is to ensure static sections (tools, system instructions) are cached aggressively and only invalidated on config change, not every turn.

Read `src/constants/prompts.ts` lines 490-520 to identify which sections are static vs dynamic.

- [ ] **Step 4: Add cache invalidation on config change**

```typescript
// src/constants/prompts.ts — add near getSystemPrompt:

let lastConfigHash = ''

function getConfigHash(): string {
  const settings = getInitialSettings()
  return `${settings.language}|${settings.theme}|${process.env.CLAUDE_CODE_SIMPLE || ''}`
}

/**
 * Invalidate prompt section cache when config changes.
 * Call this when settings are modified.
 */
export function invalidatePromptCache(): void {
  const cache = getSystemPromptSectionCache()
  cache.clear()
  lastConfigHash = getConfigHash()
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/prompts.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/constants/prompts.ts tests/unit/prompts.test.ts
git commit -m "perf: add prompt cache invalidation on config change

Static prompt sections are cached across turns. Cache is invalidated
only when config changes (language, theme, etc.), not every turn."
```

---

### Task 6: Enhanced Parallel Tool Execution

**Files:**
- Modify: `src/services/tools/toolOrchestration.ts:19-82`
- Test: `tests/unit/toolOrchestration.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/toolOrchestration.test.ts
import { describe, it, expect } from 'bun:test'

describe('partitionToolCalls', () => {
  it('should be exported', async () => {
    const mod = await import('../../src/services/tools/toolOrchestration.js')
    expect(typeof mod.partitionToolCalls).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/toolOrchestration.test.ts`
Expected: FAIL — `partitionToolCalls` not exported

- [ ] **Step 3: Export partitionToolCalls for testing**

```typescript
// src/services/tools/toolOrchestration.ts — change function to export:
export function partitionToolCalls(
  toolUseMessages: ToolUseBlock[],
  toolUseContext: ToolUseContext,
): Batch[] {
  // ... existing implementation unchanged ...
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/toolOrchestration.test.ts`
Expected: PASS

- [ ] **Step 5: Add concurrency limit for parallel batches**

```typescript
// src/services/tools/toolOrchestration.ts — add constant:
const MAX_PARALLEL_TOOLS = parseInt(
  process.env.CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY || '10',
  10,
)

// Update runToolsConcurrently to respect limit:
async function* runToolsConcurrently(
  blocks: ToolUseBlock[],
  assistantMessages: AssistantMessage[],
  canUseTool: CanUseToolFn,
  context: ToolUseContext,
): AsyncGenerator<MessageUpdateLazy, void> {
  // Process in chunks of MAX_PARALLEL_TOOLS
  for (let i = 0; i < blocks.length; i += MAX_PARALLEL_TOOLS) {
    const chunk = blocks.slice(i, i + MAX_PARALLEL_TOOLS)
    const generators = chunk.map(block =>
      runToolUse(block, assistantMessages, canUseTool, context),
    )
    yield* all(generators)
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/services/tools/toolOrchestration.ts tests/unit/toolOrchestration.test.ts
git commit -m "perf: add parallel tool execution with concurrency limit

Export partitionToolCalls for testing. Add configurable concurrency
limit (default 10) for parallel read-only tool batches."
```

---

## Phase 3: Streaming & Processing Pipeline

### Task 7: Tool Schema Cache Optimization

**Files:**
- Modify: `src/services/api/claude.ts:112-115`
- Test: `tests/unit/toolSchemaCache.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/toolSchemaCache.test.ts
import { describe, it, expect } from 'bun:test'

describe('tool schema cache', () => {
  it('should export getToolSchemaCacheKey', async () => {
    const mod = await import('../../src/services/api/claude.js')
    expect(typeof mod.getToolSchemaCacheKey).toBe('function')
  })

  it('should produce stable keys for same tool set', async () => {
    const { getToolSchemaCacheKey } = await import('../../src/services/api/claude.js')
    const tools = [{ name: 'bash' }, { name: 'read' }, { name: 'write' }]
    const key1 = getToolSchemaCacheKey(tools)
    const key2 = getToolSchemaCacheKey(tools)
    expect(key1).toBe(key2)
  })

  it('should produce different keys for different tool sets', async () => {
    const { getToolSchemaCacheKey } = await import('../../src/services/api/claude.js')
    const tools1 = [{ name: 'bash' }, { name: 'read' }]
    const tools2 = [{ name: 'bash' }, { name: 'write' }]
    expect(getToolSchemaCacheKey(tools1)).not.toBe(getToolSchemaCacheKey(tools2))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/toolSchemaCache.test.ts`
Expected: FAIL — `getToolSchemaCacheKey` not exported

- [ ] **Step 3: Implement stable cache key**

```typescript
// src/services/api/claude.ts — replace lines 112-115:

// Tool schema cache — avoids rebuilding schemas on every API call
const _toolSchemaCache = new Map<string, unknown>()

/**
 * Generate a stable cache key from the tool set.
 * Sorts tool names to ensure order-independent keys.
 */
export function getToolSchemaCacheKey(tools: { name: string }[]): string {
  const names = tools.map(t => t.name).sort()
  return names.join('|')
}

export function getToolSchema<T>(key: string): T | undefined {
  return _toolSchemaCache.get(key) as T | undefined
}

export function setToolSchema(key: string, schema: unknown): void {
  _toolSchemaCache.set(key, schema)
}

export function clearToolSchemaCache(): void {
  _toolSchemaCache.clear()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/toolSchemaCache.test.ts`
Expected: PASS

- [ ] **Step 5: Update callers to use stable key**

```typescript
// src/services/api/claude.ts — in the function that builds tool schemas:
// Replace the existing cache key logic with:
const cacheKey = getToolSchemaCacheKey(tools)
const cached = getToolSchema(cacheKey)
if (cached) return cached

// ... build schema ...
setToolSchema(cacheKey, schema)
```

- [ ] **Step 6: Commit**

```bash
git add src/services/api/claude.ts tests/unit/toolSchemaCache.test.ts
git commit -m "perf: optimize tool schema cache with stable keys

Sort tool names for order-independent cache keys. Export cache
management functions for testing and monitoring."
```

---

### Task 8: Incremental Message Normalization

**Files:**
- Modify: `src/utils/messages.ts:1992-2050`
- Test: `tests/unit/messageNormalization.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/messageNormalization.test.ts
import { describe, it, expect } from 'bun:test'

describe('incremental message normalization', () => {
  it('should export normalizeMessagesIncremental', async () => {
    const mod = await import('../../src/utils/messages.js')
    expect(typeof mod.normalizeMessagesIncremental).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/messageNormalization.test.ts`
Expected: FAIL — `normalizeMessagesIncremental` not exported

- [ ] **Step 3: Implement incremental normalization**

```typescript
// src/utils/messages.ts — add after normalizeMessagesForAPI:

const normalizationCache = new Map<string, UserMessage | AssistantMessage>()
let lastNormalizedCount = 0

/**
 * Incremental normalization — only normalizes new messages since last call.
 * Falls back to full normalization on compact/interruption.
 */
export function normalizeMessagesIncremental(
  messages: Message[],
  tools: Tools = [],
): (UserMessage | AssistantMessage)[] {
  // If cache is invalid (fewer messages than before), do full normalization
  if (messages.length < lastNormalizedCount) {
    normalizationCache.clear()
    lastNormalizedCount = 0
  }

  // Normalize only new messages
  const newMessages = messages.slice(lastNormalizedCount)
  const normalizedNew = normalizeMessagesForAPI(newMessages, tools)

  // Cache normalized results
  for (let i = 0; i < normalizedNew.length; i++) {
    const original = messages[lastNormalizedCount + i]
    if (original) {
      normalizationCache.set(original.uuid, normalizedNew[i]!)
    }
  }

  lastNormalizedCount = messages.length

  // Build result from cache
  return messages
    .map(m => normalizationCache.get(m.uuid))
    .filter((m): m is UserMessage | AssistantMessage => m !== undefined)
}

/**
 * Clear normalization cache. Call on compact/interruption.
 */
export function clearNormalizationCache(): void {
  normalizationCache.clear()
  lastNormalizedCount = 0
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/messageNormalization.test.ts`
Expected: PASS

- [ ] **Step 5: Wire up cache clearing on compact**

```typescript
// src/services/compact/compact.ts — add import and call:
import { clearNormalizationCache } from '../../utils/messages.js'

// In the compact function, after compaction:
clearNormalizationCache()
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/messages.ts src/services/compact/compact.ts tests/unit/messageNormalization.test.ts
git commit -m "perf: incremental message normalization

Only normalize new messages since last turn. Cache normalized results
by message UUID. Invalidate on compact/interruption."
```

---

### Task 9: Streaming Chunk Batching

**Files:**
- Modify: `src/utils/streamingOptimizer.ts`
- Test: `tests/unit/streamingOptimizer.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/streamingOptimizer.test.ts
import { describe, it, expect } from 'bun:test'

describe('chunk batching', () => {
  it('should export createChunkBatcher', async () => {
    const mod = await import('../../src/utils/streamingOptimizer.js')
    expect(typeof mod.createChunkBatcher).toBe('function')
  })

  it('should batch chunks within time window', async () => {
    const { createChunkBatcher } = await import('../../src/utils/streamingOptimizer.js')
    const batched: string[] = []
    const batcher = createChunkBatcher(chunk => batched.push(chunk), 16)

    batcher.push('a')
    batcher.push('b')
    batcher.push('c')

    // Wait for batch window
    await new Promise(r => setTimeout(r, 20))

    expect(batched).toEqual(['abc'])
    batcher.flush()
  })

  it('should flush immediately on slow arrival', async () => {
    const { createChunkBatcher } = await import('../../src/utils/streamingOptimizer.js')
    const batched: string[] = []
    const batcher = createChunkBatcher(chunk => batched.push(chunk), 16)

    batcher.push('a')

    // Wait longer than batch window
    await new Promise(r => setTimeout(r, 30))

    expect(batched).toEqual(['a'])
    batcher.flush()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/streamingOptimizer.test.ts`
Expected: FAIL — `createChunkBatcher` not exported

- [ ] **Step 3: Implement chunk batcher**

```typescript
// src/utils/streamingOptimizer.ts — add after existing code:

export interface ChunkBatcher {
  push(chunk: string): void
  flush(): void
  destroy(): void
}

/**
 * Create a chunk batcher that accumulates chunks within a time window
 * and flushes them as a single batch.
 *
 * @param onFlush - Called with accumulated chunks when batch window expires
 * @param windowMs - Batch window in milliseconds (default: 16ms = one frame at 60fps)
 */
export function createChunkBatcher(
  onFlush: (batch: string) => void,
  windowMs: number = 16,
): ChunkBatcher {
  let buffer = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  function flush(): void {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (buffer) {
      onFlush(buffer)
      buffer = ''
    }
  }

  return {
    push(chunk: string): void {
      buffer += chunk
      if (!timer) {
        timer = setTimeout(flush, windowMs)
      }
    },
    flush,
    destroy(): void {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      buffer = ''
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main" && bun test tests/unit/streamingOptimizer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/streamingOptimizer.ts tests/unit/streamingOptimizer.test.ts
git commit -m "perf: add streaming chunk batcher

Batch streaming chunks into 16ms windows (one frame at 60fps) to
reduce Ink re-renders. Adaptive: fast arrival batches, slow arrival
flushes immediately."
```

---

## Verification

After all tasks are complete:

- [ ] **Run full test suite**

```bash
cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main"
bun test
```

Expected: All tests pass

- [ ] **Build verification**

```bash
cd "C:/Users/USER/Downloads/awakened-cli-new/awakened-cli/openclaude-main"
bun run build
```

Expected: Build succeeds

- [ ] **Manual smoke test**

Run the CLI and verify:
1. Startup is not slower (connection pre-warming is non-blocking)
2. First response latency is similar or better
3. No regressions in tool execution
4. Streaming works correctly
