import { describe, expect, test } from 'bun:test'
import { getHardwareSnapshot, renderPercentBar } from './hardwareStats.js'

describe('hardwareStats', () => {
  test('renderPercentBar clamps and fills', () => {
    expect(renderPercentBar(50, 10)).toBe('█████░░░░░')
    expect(renderPercentBar(0, 4)).toBe('░░░░')
    expect(renderPercentBar(100, 4)).toBe('████')
    expect(renderPercentBar(150, 4)).toBe('████')
  })

  test('getHardwareSnapshot returns sane RAM fields', () => {
    const s = getHardwareSnapshot()
    expect(s.cpuCores).toBeGreaterThan(0)
    expect(s.ramTotalMb).toBeGreaterThan(0)
    expect(s.ramUsedPercent).toBeGreaterThanOrEqual(0)
    expect(s.ramUsedPercent).toBeLessThanOrEqual(100)
  })
})
