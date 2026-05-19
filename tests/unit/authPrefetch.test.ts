import { describe, it, expect } from 'bun:test'

describe('auth token pre-fetch', () => {
  it('should export scheduleTokenRefresh', async () => {
    const auth = await import('../../src/utils/auth.js')
    expect(typeof auth.scheduleTokenRefresh).toBe('function')
  })
})
