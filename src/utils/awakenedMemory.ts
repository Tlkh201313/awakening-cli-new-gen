/**
 * Auto RAM profiling for Awakened CLI: tier detection, env tuning, UI/backoff
 * under memory pressure, and staggered deferred work to avoid lag spikes.
 */

import os from 'node:os'
import { logForDebugging } from './debug.js'
import { isEnvTruthy } from './envUtils.js'

export type RamTier = 'constrained' | 'balanced' | 'spacious'

/** 0 = normal, 1 = high heap, 2 = critical heap — slows UI coalescing to cut spikes. */
export type MemoryPressureLevel = 0 | 1 | 2

const RAM_PROFILES = {
  constrained: {
    uvThreadPool: 4,
    uiFrameMs: 28,
    streamFlushMs: 24,
    deferredStaggerMs: 500,
    perfMode: false,
    heapHighMb: 1600,
    heapCriticalMb: 2400,
  },
  balanced: {
    uvThreadPool: 8,
    uiFrameMs: 16,
    streamFlushMs: 10,
    deferredStaggerMs: 250,
    perfMode: true,
    heapHighMb: 2400,
    heapCriticalMb: 3600,
  },
  spacious: {
    uvThreadPool: 16,
    uiFrameMs: 12,
    streamFlushMs: 8,
    deferredStaggerMs: 120,
    perfMode: true,
    heapHighMb: 2800,
    heapCriticalMb: 4500,
  },
} as const satisfies Record<
  RamTier,
  {
    uvThreadPool: number
    uiFrameMs: number
    streamFlushMs: number
    deferredStaggerMs: number
    perfMode: boolean
    heapHighMb: number
    heapCriticalMb: number
  }
>

let cachedTier: RamTier | undefined
let profileApplied = false
let memoryPressureLevel: MemoryPressureLevel = 0
let autoPerfEnabled: boolean | undefined
const sessionStartedAt = Date.now()
let lastElevatedPressureAt = 0
let longSessionWatchdog: ReturnType<typeof setInterval> | null = null

/** Test-only: reset cached tier / pressure between cases. */
export function resetAwakenedMemoryStateForTests(): void {
  cachedTier = undefined
  profileApplied = false
  memoryPressureLevel = 0
  autoPerfEnabled = undefined
  lastElevatedPressureAt = 0
  if (longSessionWatchdog !== null) {
    clearInterval(longSessionWatchdog)
    longSessionWatchdog = null
  }
}

function isEcoMode(): boolean {
  return (
    isEnvTruthy(process.env.OPENCLAUDE_ECO) ||
    isEnvTruthy(process.env.AWAKENED_ECO)
  )
}

export function getSessionAgeMs(): number {
  return Date.now() - sessionStartedAt
}

export function getTotalRamMb(): number {
  return Math.floor(os.totalmem() / (1024 * 1024))
}

export function getRamTier(): RamTier {
  if (cachedTier !== undefined) return cachedTier
  if (isEcoMode()) {
    cachedTier = 'constrained'
    return cachedTier
  }
  if (
    !isEnvTruthy(process.env.AWAKENED_NO_AUTO_ECO) &&
    getTotalRamMb() < 10_240
  ) {
    cachedTier = 'constrained'
    return cachedTier
  }
  const totalMb = getTotalRamMb()
  if (totalMb < 8_192) cachedTier = 'constrained'
  else if (totalMb < 16_384) cachedTier = 'balanced'
  else cachedTier = 'spacious'
  return cachedTier
}

export function getRamProfile(tier: RamTier = getRamTier()) {
  return RAM_PROFILES[tier]
}

export function getDefaultMaxOldSpaceSizeMb(): number {
  const totalMb = getTotalRamMb()
  const quarter = Math.floor(totalMb * 0.25)
  if (totalMb < 6_144) return 1536
  if (totalMb < 8_192) return Math.min(2048, quarter)
  if (totalMb < 16_384) return Math.min(4096, quarter)
  return Math.min(8192, quarter)
}

export function isAwakenedPerformanceMode(): boolean {
  if (isEcoMode()) return false
  if (
    isEnvTruthy(process.env.OPENCLAUDE_PERFORMANCE) ||
    isEnvTruthy(process.env.CLAUDE_CODE_FAST_UI)
  ) {
    return true
  }
  if (autoPerfEnabled === undefined) {
    const tier = getRamTier()
    const profile = getRamProfile(tier)
    if (!profile.perfMode) {
      autoPerfEnabled = false
    } else {
      autoPerfEnabled =
        tier === 'spacious' ||
        (tier === 'balanced' &&
          (process.platform === 'win32' || os.cpus().length >= 4))
    }
  }
  return autoPerfEnabled
}

export function getMemoryPressureLevel(): MemoryPressureLevel {
  return memoryPressureLevel
}

/** Multiplier for Ink frame interval under pressure (1 = no change). Kept mild — heavy throttling freezes UI after tab switch. */
function isMemoryUiThrottleDisabled(): boolean {
  return (
    isEnvTruthy(process.env.OPENCLAUDE_DISABLE_MEMORY_UI_THROTTLE) ||
    isEnvTruthy(process.env.AWAKENED_DISABLE_MEMORY_UI_THROTTLE)
  )
}

export function getMemoryPressureFrameMultiplier(): number {
  if (isMemoryUiThrottleDisabled()) return 1
  if (memoryPressureLevel === 2) return 1.2
  if (memoryPressureLevel === 1) return 1.08
  return 1
}

const LONG_SESSION_COALESCE_MS = 5 * 60 * 1000

export function getStreamFlushMsForTier(): number {
  const base = getRamProfile().streamFlushMs
  if (isMemoryUiThrottleDisabled()) return base
  let ms = base
  if (memoryPressureLevel === 2) ms = Math.min(28, base + 10)
  else if (memoryPressureLevel === 1) ms = Math.min(24, base + 4)
  // After ~5 min, coalesce stream UI more (CPU/RAM) without slowing Ink frames.
  if (
    memoryPressureLevel === 0 &&
    getSessionAgeMs() >= LONG_SESSION_COALESCE_MS
  ) {
    ms = Math.min(32, ms + 6)
  }
  return ms
}

export function getDeferredPrefetchStaggerMs(): number {
  const base = getRamProfile().deferredStaggerMs
  if (memoryPressureLevel >= 1) return base * 2
  return base
}

function setMemoryPressureLevel(next: MemoryPressureLevel, heapMb: number): void {
  if (next === memoryPressureLevel) return
  if (next > 0) {
    lastElevatedPressureAt = Date.now()
  } else {
    lastElevatedPressureAt = 0
  }
  memoryPressureLevel = next
  logForDebugging(
    `[memory] pressure=${next} heap=${Math.round(heapMb)}MiB tier=${getRamTier()}`,
    { level: next > 0 ? 'warn' : 'info' },
  )
}

/**
 * Step pressure down when heap has cooled but sits in the hysteresis band.
 * Prevents "frozen" UI after long sessions that briefly crossed heapHigh.
 */
export function tickMemoryPressureDecay(heapUsedBytes?: number): void {
  if (memoryPressureLevel === 0) return
  const heapMb =
    (heapUsedBytes ?? process.memoryUsage().heapUsed) / (1024 * 1024)
  const { heapHighMb, heapCriticalMb } = getRamProfile()
  if (heapMb >= heapCriticalMb) return

  const recoverBelowMb = heapHighMb * 0.88
  if (heapMb < recoverBelowMb) {
    setMemoryPressureLevel(0, heapMb)
    return
  }

  const elevatedForMs =
    lastElevatedPressureAt > 0 ? Date.now() - lastElevatedPressureAt : 0
  if (heapMb < heapHighMb && elevatedForMs >= 45_000) {
    const next = (memoryPressureLevel - 1) as MemoryPressureLevel
    setMemoryPressureLevel(next, heapMb)
  }
}

/**
 * Update runtime pressure from current heap (bytes). Called by useMemoryUsage.
 */
export function updateMemoryPressureFromHeap(heapUsedBytes: number): MemoryPressureLevel {
  const { heapHighMb, heapCriticalMb } = getRamProfile()
  const heapMb = heapUsedBytes / (1024 * 1024)
  const recoverBelowMb = heapHighMb * 0.88
  let next: MemoryPressureLevel
  if (heapMb >= heapCriticalMb) {
    next = 2
  } else if (heapMb >= heapHighMb) {
    next = memoryPressureLevel === 0 ? 1 : Math.max(memoryPressureLevel, 1)
  } else if (heapMb < recoverBelowMb) {
    next = 0
  } else if (memoryPressureLevel > 0 && heapMb < heapHighMb) {
    // Hysteresis band: decay instead of holding elevated pressure forever.
    next = (memoryPressureLevel - 1) as MemoryPressureLevel
  } else {
    next = memoryPressureLevel
  }
  setMemoryPressureLevel(next, heapMb)
  return memoryPressureLevel
}

/**
 * Periodic relief during long REPL sessions (heap sample + pressure decay).
 * Returns cleanup for useEffect.
 */
export function registerLongSessionMemoryWatchdog(): () => void {
  if (longSessionWatchdog !== null) {
    clearInterval(longSessionWatchdog)
  }
  longSessionWatchdog = setInterval(() => {
    const heapUsed = process.memoryUsage().heapUsed
    updateMemoryPressureFromHeap(heapUsed)
    tickMemoryPressureDecay(heapUsed)
    const { heapHighMb } = getRamProfile()
    const heapMb = heapUsed / (1024 * 1024)
    if (memoryPressureLevel > 0 && heapMb < heapHighMb * 0.94) {
      setMemoryPressureLevel(0, heapMb)
    }
  }, 30_000)
  return () => {
    if (longSessionWatchdog !== null) {
      clearInterval(longSessionWatchdog)
      longSessionWatchdog = null
    }
  }
}

/**
 * After terminal tab regains focus: re-sample heap and drop pressure if we recovered.
 * Prevents "frozen" UI from aggressive coalescing left over while backgrounded.
 */
export function recoverClientUiAfterTerminalFocus(): void {
  const heapUsed = process.memoryUsage().heapUsed
  updateMemoryPressureFromHeap(heapUsed)
  const { heapHighMb } = getRamProfile()
  const heapMb = heapUsed / (1024 * 1024)
  if (memoryPressureLevel > 0 && heapMb < heapHighMb * 0.92) {
    setMemoryPressureLevel(0, heapMb)
    logForDebugging(
      `[memory] pressure=0 after focus (heap=${Math.round(heapMb)}MiB)`,
      { level: 'info' },
    )
  }
}

function setEnvIfUnset(key: string, value: string): void {
  if (!process.env[key]?.trim()) {
    process.env[key] = value
  }
}

/**
 * Apply tier-based defaults once per process (respects user overrides in env).
 * Safe to call from cli entry and main action handler.
 */
export function applyAwakenedMemoryProfile(): void {
  if (profileApplied) return
  profileApplied = true

  const tier = getRamTier()
  const profile = getRamProfile(tier)
  const perf = isAwakenedPerformanceMode()

  setEnvIfUnset('UV_THREADPOOL_SIZE', String(profile.uvThreadPool))

  if (!process.env.CLAUDE_CODE_UI_FRAME_MS?.trim()) {
    const frameMs = perf ? profile.uiFrameMs : Math.max(profile.uiFrameMs, 28)
    setEnvIfUnset('CLAUDE_CODE_UI_FRAME_MS', String(frameMs))
  }
  if (!process.env.CLAUDE_CODE_STREAM_UI_FLUSH_MS?.trim()) {
    const flushMs = perf ? profile.streamFlushMs : Math.max(profile.streamFlushMs, 20)
    setEnvIfUnset('CLAUDE_CODE_STREAM_UI_FLUSH_MS', String(flushMs))
  }
  if (perf && !process.env.OPENCLAUDE_FAST_STARTUP?.trim()) {
    setEnvIfUnset('OPENCLAUDE_FAST_STARTUP', '1')
  }

  logForDebugging(
    `[memory] tier=${tier} ram=${getTotalRamMb()}MiB perf=${perf} uv=${process.env.UV_THREADPOOL_SIZE} ui=${process.env.CLAUDE_CODE_UI_FRAME_MS} flush=${process.env.CLAUDE_CODE_STREAM_UI_FLUSH_MS}`,
    { level: 'info' },
  )
}

/** @deprecated Use applyAwakenedMemoryProfile */
export function applyAwakenedRuntimeBoost(): void {
  applyAwakenedMemoryProfile()
}

/**
 * Run deferred startup tasks spaced apart to avoid RAM/CPU spikes (same work, spread out).
 */
export function runStaggeredDeferredTasks(
  tasks: ReadonlyArray<() => void | Promise<void>>,
): void {
  const gap = getDeferredPrefetchStaggerMs()
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]!
    if (i === 0) {
      void Promise.resolve().then(() => task())
    } else {
      setTimeout(() => {
        void Promise.resolve().then(() => task())
      }, i * gap)
    }
  }
}
