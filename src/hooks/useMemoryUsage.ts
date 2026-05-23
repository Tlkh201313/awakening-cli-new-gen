import { useState } from 'react'
import { useInterval } from 'usehooks-ts'
import {
  getRamProfile,
  updateMemoryPressureFromHeap,
} from '../utils/awakenedMemory.js'

export type MemoryUsageStatus = 'normal' | 'high' | 'critical'

export type MemoryUsageInfo = {
  heapUsed: number
  status: MemoryUsageStatus
}

/**
 * Hook to monitor Node.js process memory usage.
 * Polls every 10 seconds; returns null while status is 'normal'.
 */
export function useMemoryUsage(): MemoryUsageInfo | null {
  const [memoryUsage, setMemoryUsage] = useState<MemoryUsageInfo | null>(null)

  useInterval(() => {
    const heapUsed = process.memoryUsage().heapUsed
    const { heapHighMb, heapCriticalMb } = getRamProfile()
    const highBytes = heapHighMb * 1024 * 1024
    const criticalBytes = heapCriticalMb * 1024 * 1024
    const pressure = updateMemoryPressureFromHeap(heapUsed)
    const status: MemoryUsageStatus =
      pressure === 2 || heapUsed >= criticalBytes
        ? 'critical'
        : pressure === 1 || heapUsed >= highBytes
          ? 'high'
          : 'normal'
    setMemoryUsage(prev => {
      // Bail when status is 'normal' — nothing is shown, so heapUsed is
      // irrelevant and we avoid re-rendering the whole Notifications subtree
      // every 10 seconds for the 99%+ of users who never reach 1.5GB.
      if (status === 'normal') return prev === null ? prev : null
      return { heapUsed, status }
    })
  }, 10_000)

  return memoryUsage
}
