/** Hardware stats and performance mode controls */

import os from 'node:os'
import {
  getRamTier,
  getTotalRamMb,
  isAwakenedPerformanceMode,
} from './awakenedMemory.js'

export const getHardwareStats = () => ({
  cpuCores: os.cpus().length,
  platform: process.platform,
  arch: process.arch,
  ramMb: getTotalRamMb(),
  ramTier: getRamTier(),
  performanceMode: isAwakenedPerformanceMode(),
})

export const printHardwareStats = () => {
  const stats = getHardwareStats()
  return `CPU: ${stats.cpuCores} cores | RAM: ${stats.ramMb} MiB (${stats.ramTier}) | perf: ${stats.performanceMode ? 'on' : 'off'} | ${stats.platform}/${stats.arch}`
}
