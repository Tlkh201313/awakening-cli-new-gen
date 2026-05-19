import { describe, it, expect } from 'bun:test'

describe('prewarmConnection', () => {
  it('should be exported and callable', async () => {
    const { prewarmConnection } = await import('../../src/services/api/client.js')
    expect(typeof prewarmConnection).toBe('function')
  })

  it('should return a promise', async () => {
    const { prewarmConnection } = await import('../../src/services/api/client.js')
    const result = prewarmConnection()
    expect(result).toBeInstanceOf(Promise)
    await result
  })
})
