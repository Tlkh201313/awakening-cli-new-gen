import { describe, it, expect } from 'bun:test'

describe('incremental message normalization', () => {
  it('should export normalizeMessagesIncremental', async () => {
    const mod = await import('../../src/utils/messages.js')
    expect(typeof mod.normalizeMessagesIncremental).toBe('function')
  })

  it('should export clearNormalizationCache', async () => {
    const mod = await import('../../src/utils/messages.js')
    expect(typeof mod.clearNormalizationCache).toBe('function')
  })
})
