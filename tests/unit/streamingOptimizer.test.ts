import { describe, it, expect } from 'bun:test'

describe('chunk batching', () => {
  it('should export createChunkBatcher', async () => {
    const mod = await import('../../src/utils/streamingOptimizer.js')
    expect(typeof mod.createChunkBatcher).toBe('function')
  })

  it('should batch chunks within time window', async () => {
    const { createChunkBatcher } = await import('../../src/utils/streamingOptimizer.js')
    const batched: string[] = []
    const batcher = createChunkBatcher(chunk => batched.push(chunk), 16)

    batcher.push('a')
    batcher.push('b')
    batcher.push('c')

    // Wait for batch window
    await new Promise(r => setTimeout(r, 20))

    expect(batched).toEqual(['abc'])
    batcher.flush()
  })

  it('should flush immediately on slow arrival', async () => {
    const { createChunkBatcher } = await import('../../src/utils/streamingOptimizer.js')
    const batched: string[] = []
    const batcher = createChunkBatcher(chunk => batched.push(chunk), 16)

    batcher.push('a')

    // Wait longer than batch window
    await new Promise(r => setTimeout(r, 30))

    expect(batched).toEqual(['a'])
    batcher.flush()
  })
})
