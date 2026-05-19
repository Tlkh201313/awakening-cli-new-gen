import { describe, it, expect } from 'bun:test'

describe('partitionToolCalls', () => {
  it('should be exported', async () => {
    const mod = await import('../../src/services/tools/toolOrchestration.js')
    expect(typeof mod.partitionToolCalls).toBe('function')
  })
})
