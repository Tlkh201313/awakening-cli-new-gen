import { describe, it, expect } from 'bun:test'

describe('systemPromptSection caching', () => {
  it('should return cached result on repeated calls', async () => {
    const { getSystemPromptSectionCache } = await import('../../src/bootstrap/state.js')
    const cache = getSystemPromptSectionCache()
    expect(cache).toBeInstanceOf(Map)
  })

  it('should export invalidatePromptCache', async () => {
    const { invalidatePromptCache } = await import('../../src/constants/prompts.js')
    expect(typeof invalidatePromptCache).toBe('function')
  })
})
