import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import {
  disableKeepAlive,
  resetKeepAliveAfterCooldown,
  isKeepAliveDisabled,
  _resetKeepAliveForTesting,
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
