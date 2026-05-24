import { afterEach, describe, expect, test } from 'bun:test'
import {
  getDefaultMaxOldSpaceSizeMb,
  getMemoryPressureLevel,
  getRamTier,
  getRamProfile,
  getMemoryPressureFrameMultiplier,
  getStreamFlushMsForTier,
  resetAwakenedMemoryStateForTests,
  updateMemoryPressureFromHeap,
} from './awakenedMemory.js'

afterEach(() => {
  delete process.env.OPENCLAUDE_ECO
  delete process.env.AWAKENED_ECO
  delete process.env.AWAKENED_NO_AUTO_ECO
  resetAwakenedMemoryStateForTests()
})

describe('awakenedMemory', () => {
  test('getDefaultMaxOldSpaceSizeMb scales with system RAM', () => {
    const mb = getDefaultMaxOldSpaceSizeMb()
    expect(mb).toBeGreaterThanOrEqual(1536)
    expect(mb).toBeLessThanOrEqual(8192)
  })

  test('eco env forces constrained tier', () => {
    process.env.AWAKENED_ECO = '1'
    expect(getRamTier()).toBe('constrained')
    expect(getRamProfile('constrained').perfMode).toBe(false)
  })

  test('pressure decays in hysteresis band after brief spike', () => {
    const profile = getRamProfile('balanced')
    updateMemoryPressureFromHeap(profile.heapHighMb * 1024 * 1024)
    expect(getMemoryPressureLevel()).toBe(1)
    const midMb = profile.heapHighMb * 0.9
    updateMemoryPressureFromHeap(midMb * 1024 * 1024)
    expect(getMemoryPressureLevel()).toBe(0)
  })

  test('memory pressure increases frame multiplier', () => {
    const profile = getRamProfile('constrained')
    updateMemoryPressureFromHeap(0)
    expect(getMemoryPressureFrameMultiplier()).toBe(1)
    updateMemoryPressureFromHeap(profile.heapCriticalMb * 1024 * 1024)
    expect(getMemoryPressureFrameMultiplier()).toBeGreaterThanOrEqual(1.08)
    expect(getMemoryPressureFrameMultiplier()).toBeLessThanOrEqual(1.25)
  })
})
