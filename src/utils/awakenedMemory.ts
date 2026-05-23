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
    uiFrameMs: 32,
    streamFlushMs: 32,
    deferredStaggerMs: 500,
    perfMode: false,
    heapHighMb: 900,
    heapCriticalMb: 1400,
  },
  balanced: {
    uvThreadPool: 8,
    uiFrameMs: 24,
    streamFlushMs: 20,
    deferredStaggerMs: 250,
    perfMode: true,
    heapHighMb: 1200,
    heapCriticalMb: 2000,
  },
  spacious: {
    uvThreadPool: 16,
    uiFrameMs: 16,
    streamFlushMs: 12,
    deferredStaggerMs: 120,
    perfMode: true,
    heapHighMb: 1500,
    heapCriticalMb: 2500,
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

/** Test-only: reset cached tier / pressure between cases. */
export function resetAwakenedMemoryStateForTests(): void {
  cachedTier = undefined
  profileApplied = false
  memoryPressureLevel = 0
  autoPerfEnabled = undefined
}

export function getTotalRamMb(): number {
  return Math.floor(os.totalmem() / (1024 * 1024))
}

export function getRamTier(): RamTier {
  if (cachedTier !== undefined) return cachedTier
  if (isEnvTruthy(process.env.OPENCLAUDE_ECO)) {
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
  if (isEnvTruthy(process.env.OPENCLAUDE_ECO)) return false
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

/** Multiplier for Ink frame interval under pressure (1 = no change). */
export function getMemoryPressureFrameMultiplier(): number {
  if (memoryPressureLevel === 2) return 2.25
  if (memoryPressureLevel === 1) return 1.5
  return 1
}

export function getStreamFlushMsForTier(): number {
  const base = getRamProfile().streamFlushMs
  if (memoryPressureLevel === 2) return Math.min(48, base * 2)
  if (memoryPressureLevel === 1) return Math.min(36, Math.round(base * 1.35))
  return base
}

export function getDeferredPrefetchStaggerMs(): number {
  const base = getRamProfile().deferredStaggerMs
  if (memoryPressureLevel >= 1) return base * 2
  return base
}

/**
 * Update runtime pressure from current heap (bytes). Called by useMemoryUsage.
 */
export function updateMemoryPressureFromHeap(heapUsedBytes: number): MemoryPressureLevel {
  const { heapHighMb, heapCriticalMb } = getRamProfile()
  const heapMb = heapUsedBytes / (1024 * 1024)
  const next: MemoryPressureLevel =
    heapMb >= heapCriticalMb ? 2 : heapMb >= heapHighMb ? 1 : 0
  if (next !== memoryPressureLevel) {
    memoryPressureLevel = next
    logForDebugging(
      `[memory] pressure=${next} heap=${Math.round(heapMb)}MiB tier=${getRamTier()}`,
      { level: next > 0 ? 'warn' : 'info' },
    )
  }
  return memoryPressureLevel
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
    const flushMs = perf ? profile.streamFlushMs : Math.max(profile.streamFlushMs, 24)
    setEnvIfUnset('CLAUDE_CODE_STREAM_UI_FLUSH_MS', String(flushMs))
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
