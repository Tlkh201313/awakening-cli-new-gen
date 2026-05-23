import { afterEach, describe, expect, test } from 'bun:test'
import {
  getDefaultMaxOldSpaceSizeMb,
  getRamTier,
  getRamProfile,
  getMemoryPressureFrameMultiplier,
  resetAwakenedMemoryStateForTests,
  updateMemoryPressureFromHeap,
} from './awakenedMemory.js'

afterEach(() => {
  delete process.env.OPENCLAUDE_ECO
  resetAwakenedMemoryStateForTests()
})

describe('awakenedMemory', () => {
  test('getDefaultMaxOldSpaceSizeMb scales with system RAM', () => {
    const mb = getDefaultMaxOldSpaceSizeMb()
    expect(mb).toBeGreaterThanOrEqual(1536)
    expect(mb).toBeLessThanOrEqual(8192)
  })

  test('AWAKENED_ECO forces constrained tier', () => {
    process.env.OPENCLAUDE_ECO = '1'
    expect(getRamTier()).toBe('constrained')
    expect(getRamProfile('constrained').perfMode).toBe(false)
  })

  test('memory pressure increases frame multiplier', () => {
    const profile = getRamProfile('constrained')
    updateMemoryPressureFromHeap(0)
    expect(getMemoryPressureFrameMultiplier()).toBe(1)
    updateMemoryPressureFromHeap(profile.heapCriticalMb * 1024 * 1024)
    expect(getMemoryPressureFrameMultiplier()).toBeGreaterThan(1)
  })
})
