import { describe, it, expect } from 'bun:test'

describe('acceptance tracking', () => {
  it('should export AcceptanceTracker', async () => {
    const mod = await import('../../src/services/analytics/acceptance.js')
    expect(mod.AcceptanceTracker).toBeDefined()
  })

  it('should track tool success and failure', async () => {
    const { AcceptanceTracker } = await import('../../src/services/analytics/acceptance.js')
    const tracker = new AcceptanceTracker()

    tracker.recordToolUse('bash', true)
    tracker.recordToolUse('bash', true)
    tracker.recordToolUse('read', false)

    const stats = tracker.getStats()
    expect(stats.totalCalls).toBe(3)
    expect(stats.successRate).toBeCloseTo(0.667, 2)
    expect(stats.byTool['bash']!.success).toBe(2)
    expect(stats.byTool['read']!.failure).toBe(1)
  })

  it('should track interruptions', async () => {
    const { AcceptanceTracker } = await import('../../src/services/analytics/acceptance.js')
    const tracker = new AcceptanceTracker()

    tracker.recordInterruption()
    tracker.recordInterruption()

    const stats = tracker.getStats()
    expect(stats.interruptions).toBe(2)
  })
})
