/** Hardware stats, bars, and performance mode controls */

import os from 'node:os'
import {
  getMemoryPressureLevel,
  getRamTier,
  getStreamFlushMsForTier,
  getTotalRamMb,
  isAwakenedPerformanceMode,
} from './awakenedMemory.js'

export type HardwareSnapshot = {
  cpuCores: number
  cpuPercent: number | null
  platform: string
  arch: string
  ramTotalMb: number
  ramUsedMb: number
  ramFreeMb: number
  ramUsedPercent: number
  ramTier: ReturnType<typeof getRamTier>
  heapUsedMb: number
  heapTotalMb: number
  rssMb: number
  memoryPressure: ReturnType<typeof getMemoryPressureLevel>
  performanceMode: boolean
  streamFlushMs: number
  loadAvg1: number | null
}

export function formatMiB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GiB`
  return `${Math.round(mb)} MiB`
}

/** Unicode bar: filled + empty blocks, width chars */
export function renderPercentBar(percent: number, width = 28): string {
  const clamped = Math.max(0, Math.min(100, percent))
  const filled = Math.round((clamped / 100) * width)
  return `${'█'.repeat(filled)}${'░'.repeat(Math.max(0, width - filled))}`
}

function getSystemRam(): {
  ramTotalMb: number
  ramUsedMb: number
  ramFreeMb: number
  ramUsedPercent: number
} {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  const ramTotalMb = Math.floor(total / (1024 * 1024))
  const ramFreeMb = Math.floor(free / (1024 * 1024))
  const ramUsedMb = Math.max(0, ramTotalMb - ramFreeMb)
  const ramUsedPercent =
    ramTotalMb > 0 ? Math.round((ramUsedMb / ramTotalMb) * 100) : 0
  return { ramTotalMb, ramUsedMb, ramFreeMb, ramUsedPercent }
}

function getCpuPercentFromLoadAvg(): number | null {
  const [load1] = os.loadavg()
  const cores = os.cpus().length
  if (!cores || load1 === undefined || load1 <= 0) return null
  return Math.min(100, Math.round((load1 / cores) * 100))
}

/** Short sample of process CPU time vs wall clock (good on Windows where loadavg is often 0). */
export async function sampleProcessCpuPercent(
  sampleMs = 100,
): Promise<number | null> {
  const cores = os.cpus().length
  if (cores < 1) return null
  const start = process.cpuUsage()
  const t0 = performance.now()
  await new Promise<void>(resolve => setTimeout(resolve, sampleMs))
  const elapsedMs = Math.max(1, performance.now() - t0)
  const delta = process.cpuUsage(start)
  const usedMs = (delta.user + delta.system) / 1000
  return Math.min(100, Math.round((usedMs / elapsedMs / cores) * 100))
}

export function getHardwareSnapshot(): HardwareSnapshot {
  const mem = process.memoryUsage()
  const ram = getSystemRam()
  const loadAvg = os.loadavg()
  return {
    cpuCores: os.cpus().length,
    cpuPercent: getCpuPercentFromLoadAvg(),
    platform: process.platform,
    arch: process.arch,
    ...ram,
    ramTier: getRamTier(),
    heapUsedMb: Math.floor(mem.heapUsed / (1024 * 1024)),
    heapTotalMb: Math.floor(mem.heapTotal / (1024 * 1024)),
    rssMb: Math.floor(mem.rss / (1024 * 1024)),
    memoryPressure: getMemoryPressureLevel(),
    performanceMode: isAwakenedPerformanceMode(),
    streamFlushMs: getStreamFlushMsForTier(),
    loadAvg1: loadAvg[0] ?? null,
  }
}

/** Async snapshot with live CPU sample when load average is unavailable. */
export async function getHardwareSnapshotLive(): Promise<HardwareSnapshot> {
  const snap = getHardwareSnapshot()
  if (snap.cpuPercent === null || snap.cpuPercent === 0) {
    const sampled = await sampleProcessCpuPercent(80)
    if (sampled !== null) snap.cpuPercent = sampled
  }
  return snap
}

export const getHardwareStats = () => {
  const s = getHardwareSnapshot()
  return {
    cpuCores: s.cpuCores,
    platform: s.platform,
    arch: s.arch,
    ramMb: s.ramTotalMb,
    ramTier: s.ramTier,
    performanceMode: s.performanceMode,
  }
}

export const printHardwareStats = () => {
  const s = getHardwareSnapshot()
  return `CPU: ${s.cpuCores} cores | RAM: ${formatMiB(s.ramUsedMb)}/${formatMiB(s.ramTotalMb)} (${s.ramUsedPercent}%) | perf: ${s.performanceMode ? 'on' : 'off'} | ${s.platform}/${s.arch}`
}
