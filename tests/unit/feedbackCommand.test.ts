import { describe, it, expect } from 'bun:test'

describe('feedback command', () => {
  it('should be enabled', async () => {
    const mod = await import('../../src/commands/feedback/index.js')
    const cmd = mod.default
    expect(cmd.isEnabled()).toBe(true)
  })

  it('should have aliases', async () => {
    const mod = await import('../../src/commands/feedback/index.js')
    expect(mod.default.aliases).toContain('bug')
  })
})
