/**
 * Streaming Stats Tracker
 * 
 * Observational stats tracking for streaming responses.
 * No buffering - purely tracks metrics for monitoring.
 */

export interface StreamStats {
  totalChunks: number
  firstTokenMs: number | null
  durationMs: number
}

export interface StreamState {
  chunkCount: number
  firstTokenTime: number | null
  startTime: number
}

export function createStreamState(): StreamState {
  return {
    chunkCount: 0,
    firstTokenTime: null,
    startTime: Date.now(),
  }
}

export function processStreamChunk(state: StreamState, _chunk: string): void {
  if (state.firstTokenTime === null) {
    state.firstTokenTime = Date.now()
  }
  state.chunkCount++
}

export function flushStreamBuffer(_state: StreamState): string {
  return '' // No-op - kept for API compatibility
}

export function getStreamStats(state: StreamState): StreamStats {
  const now = Date.now()
  const firstTokenMs = state.firstTokenTime
    ? now - state.firstTokenTime
    : null
  const durationMs = now - state.startTime

  return {
    totalChunks: state.chunkCount,
    firstTokenMs,
    durationMs,
  }
}

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