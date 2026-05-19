import { describe, it, expect } from 'bun:test'

describe('tool schema cache', () => {
  it('should export getToolSchemaCacheKey', async () => {
    const mod = await import('../../src/services/api/claude.js')
    expect(typeof mod.getToolSchemaCacheKey).toBe('function')
  })

  it('should produce stable keys for same tool set', async () => {
    const { getToolSchemaCacheKey } = await import('../../src/services/api/claude.js')
    const tools = [{ name: 'bash' }, { name: 'read' }, { name: 'write' }]
    const key1 = getToolSchemaCacheKey(tools)
    const key2 = getToolSchemaCacheKey(tools)
    expect(key1).toBe(key2)
  })

  it('should produce different keys for different tool sets', async () => {
    const { getToolSchemaCacheKey } = await import('../../src/services/api/claude.js')
    const tools1 = [{ name: 'bash' }, { name: 'read' }]
    const tools2 = [{ name: 'bash' }, { name: 'write' }]
    expect(getToolSchemaCacheKey(tools1)).not.toBe(getToolSchemaCacheKey(tools2))
  })
})
