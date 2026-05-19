import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import {
  disableKeepAlive,
  resetKeepAliveAfterCooldown,
  isKeepAliveDisabled,
  _resetKeepAliveForTesting,
  shouldBypassProxy,
} from '../../src/utils/proxy.js'

describe('keep-alive cooldown', () => {
  beforeEach(() => {
    _resetKeepAliveForTesting()
  })

  it('should disable keep-alive on ECONNRESET', () => {
    disableKeepAlive()
    expect(isKeepAliveDisabled()).toBe(true)
  })

  it('should re-enable keep-alive after cooldown', () => {
    disableKeepAlive()
    resetKeepAliveAfterCooldown(100) // 100ms cooldown for testing
    expect(isKeepAliveDisabled()).toBe(true)

    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(isKeepAliveDisabled()).toBe(false)
        resolve()
      }, 150)
    })
  })

  it('should not re-enable if cooldown not started', () => {
    disableKeepAlive()
    expect(isKeepAliveDisabled()).toBe(true)
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(isKeepAliveDisabled()).toBe(true)
        resolve()
      }, 50)
    })
  })
})

describe('shouldBypassProxy caching', () => {
  it('should return consistent results for repeated URLs', () => {
    const url = 'https://api.example.com/v1/test'
    const noProxy = '.example.com'

    const result1 = shouldBypassProxy(url, noProxy)
    const result2 = shouldBypassProxy(url, noProxy)

    expect(result1).toBe(true)
    expect(result2).toBe(true)
  })

  it('should handle different URLs correctly', () => {
    const noProxy = '.example.com'

    expect(shouldBypassProxy('https://api.example.com/v1', noProxy)).toBe(true)
    expect(shouldBypassProxy('https://other.com/v1', noProxy)).toBe(false)
  })
})
