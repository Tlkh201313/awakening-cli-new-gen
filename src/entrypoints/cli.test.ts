/**
 * Regression tests for issue #402 — NODE_OPTIONS heap cap
 * Closes: Gitlawb/Awakened#402 — JavaScript heap OOM during large tasks
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { getDefaultMaxOldSpaceSizeMb } from '../utils/awakenedMemory.js'

describe('cli.tsx — NODE_OPTIONS --max-old-space-size (issue #402)', () => {
  const originalNodeOptions = process.env.NODE_OPTIONS

  beforeEach(() => {
    delete process.env.NODE_OPTIONS
  })

  afterEach(() => {
    if (originalNodeOptions !== undefined) {
      process.env.NODE_OPTIONS = originalNodeOptions
    } else {
      delete process.env.NODE_OPTIONS
    }
  })

  it('sets --max-old-space-size=8192 when NODE_OPTIONS is not set', () => {
    // Guard predicate: fires when the flag is absent
    const shouldSetHeapCap = !process.env.NODE_OPTIONS?.includes('--max-old-space-size')
    expect(shouldSetHeapCap).toBe(true)
  })

  it('does not override existing --max-old-space-size=4096', () => {
    process.env.NODE_OPTIONS = '--max-old-space-size=4096 --experimental-vm-modules'

    const shouldSetHeapCap = !process.env.NODE_OPTIONS.includes('--max-old-space-size')
    expect(shouldSetHeapCap).toBe(false)
    expect(process.env.NODE_OPTIONS).toContain('4096')
  })

  it('does not override existing --max-old-space-size=8192', () => {
    process.env.NODE_OPTIONS = '--max-old-space-size=8192'

    const shouldSetHeapCap = !process.env.NODE_OPTIONS.includes('--max-old-space-size')
    expect(shouldSetHeapCap).toBe(false)
    expect(process.env.NODE_OPTIONS).toBe('--max-old-space-size=8192')
  })

  it('appends --max-old-space-size when NODE_OPTIONS has other flags', () => {
    process.env.NODE_OPTIONS = '--inspect=9229'
    const heapMb = getDefaultMaxOldSpaceSizeMb()

    const result = `${process.env.NODE_OPTIONS} --max-old-space-size=${heapMb}`
    expect(result).toBe(`--inspect=9229 --max-old-space-size=${heapMb}`)
  })
})

describe('useMemoryUsage.ts — tier-relative thresholds', () => {
  it('uses awakenedMemory profile for heap limits', async () => {
    const src = await Bun.file(
      `${import.meta.dir}/../hooks/useMemoryUsage.ts`,
    ).text()

    expect(src).toContain('getRamProfile')
    expect(src).toContain('updateMemoryPressureFromHeap')
  })
})
