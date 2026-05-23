import os from 'node:os'
import { isEnvTruthy } from './envUtils.js'

let autoPerfEnabled: boolean | undefined

/**
 * Prefer responsiveness and startup throughput over conservative UI pacing.
 * Auto-on for 4+ logical cores OR Windows platform unless AWAKENED_ECO=1.
 */
export function isAwakenedPerformanceMode(): boolean {
  if (isEnvTruthy(process.env.AWAKENED_ECO)) return false
  if (
    isEnvTruthy(process.env.AWAKENED_PERFORMANCE) ||
    isEnvTruthy(process.env.CLAUDE_CODE_FAST_UI)
  ) {
    return true
  }
  if (autoPerfEnabled === undefined) {
    // Lower threshold: 4 cores (was 6) + auto-enable on Windows (Ink jank mitigation)
    autoPerfEnabled = os.cpus().length >= 4 || process.platform === 'win32'
  }
  return autoPerfEnabled
}

/** Call as early as possible (bin entry) to widen libuv pool for I/O-heavy work. */
export function applyAwakenedRuntimeBoost(): void {
  if (!process.env.UV_THREADPOOL_SIZE) {
    const cores = os.cpus().length
    process.env.UV_THREADPOOL_SIZE = String(Math.min(256, Math.max(64, cores * 12)))
  }
  if (isAwakenedPerformanceMode() && !process.env.CLAUDE_CODE_STREAM_UI_FLUSH_MS) {
    process.env.CLAUDE_CODE_STREAM_UI_FLUSH_MS = '12'
  }
  if (isAwakenedPerformanceMode() && !process.env.CLAUDE_CODE_UI_FRAME_MS) {
    process.env.CLAUDE_CODE_UI_FRAME_MS = '16'
  }
}
