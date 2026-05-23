/**
 * Coalesce high-frequency stream UI updates (thinking/text deltas) so Ink
 * does not reconcile the full REPL tree on every token (~60fps freezes on
 * Windows conhost and during long retry spinners).
 */

const DEFAULT_DELTA_FLUSH_MS = 32
const DEFAULT_DELTA_FLUSH_MS_WIN32 = 48

function defaultDeltaFlushMs(): number {
  return process.platform === 'win32'
    ? DEFAULT_DELTA_FLUSH_MS_WIN32
    : DEFAULT_DELTA_FLUSH_MS
}

function parseFlushMs(): number {
  const raw = process.env.CLAUDE_CODE_STREAM_UI_FLUSH_MS?.trim()
  if (!raw) return defaultDeltaFlushMs()
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 8 || n > 200) return defaultDeltaFlushMs()
  return n
}

type PendingFlush = {
  flush: () => void
  timer: ReturnType<typeof setTimeout> | null
}

function createThrottleState(): PendingFlush {
  return { flush: () => {}, timer: null }
}

const thinkingState = createThrottleState()
const textState = createThrottleState()
const toolInputState = createThrottleState()
let thinkingFirstUpdatePending = true
let textFirstUpdatePending = true
let toolInputFirstUpdatePending = true

function schedule(
  state: PendingFlush,
  run: () => void,
  delayMs: number,
): void {
  state.flush = run
  if (state.timer !== null) return
  state.timer = setTimeout(() => {
    state.timer = null
    const fn = state.flush
    state.flush = () => {}
    fn()
  }, delayMs)
}

export function resetStreamUiThrottleState(): void {
  thinkingFirstUpdatePending = true
  textFirstUpdatePending = true
  toolInputFirstUpdatePending = true
  for (const state of [thinkingState, textState, toolInputState]) {
    if (state.timer !== null) {
      clearTimeout(state.timer)
      state.timer = null
    }
    state.flush = () => {}
  }
}

export function flushStreamUiThrottleState(): void {
  for (const state of [thinkingState, textState, toolInputState]) {
    if (state.timer !== null) {
      clearTimeout(state.timer)
      state.timer = null
    }
    const fn = state.flush
    state.flush = () => {}
    fn()
  }
}

export function scheduleStreamingThinkingUiUpdate(run: () => void): void {
  if (thinkingFirstUpdatePending) {
    thinkingFirstUpdatePending = false
    run()
    return
  }
  schedule(thinkingState, run, parseFlushMs())
}

export function scheduleStreamingTextUiUpdate(run: () => void): void {
  if (textFirstUpdatePending) {
    textFirstUpdatePending = false
    run()
    return
  }
  schedule(textState, run, parseFlushMs())
}

/** Coalesce tool-argument JSON deltas (high frequency during large tool calls). */
export function scheduleStreamingToolInputUiUpdate(run: () => void): void {
  if (toolInputFirstUpdatePending) {
    toolInputFirstUpdatePending = false
    run()
    return
  }
  schedule(toolInputState, run, parseFlushMs())
}
