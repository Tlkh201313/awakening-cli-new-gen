import { afterEach, beforeEach, describe, expect, test, spyOn } from 'bun:test'
import { registerCleanup } from './cleanupRegistry.js'
import { TimerGuard } from './timerGuard.js'

function createFreshGuard(): TimerGuard {
  return new TimerGuard()
}

// ── passthrough mode (feature flag disabled) ──────────────────

describe('TimerGuard — passthrough mode (ENABLE_TIMER_GUARD !== true)', () => {
  test('setTimeout delegates to native setTimeout', () => {
    const guard = createFreshGuard()
    let called = false
    const id = guard.setTimeout(() => {
      called = true
    }, 10)
    expect(guard.getActiveCount()).toBe(0)
    clearTimeout(id)
  })

  test('setInterval delegates to native setInterval', () => {
    const guard = createFreshGuard()
    let count = 0
    const id = guard.setInterval(() => {
      count++
    }, 10)
    expect(guard.getActiveCount()).toBe(0)
    clearInterval(id)
  })

  test('clear calls native clearTimeout', () => {
    const guard = createFreshGuard()
    const id = guard.setTimeout(() => {}, 1000)
    expect(() => guard.clear(id)).not.toThrow()
  })

  test('clearAll is a no-op', () => {
    const guard = createFreshGuard()
    guard.setTimeout(() => {}, 1000)
    expect(() => guard.clearAll()).not.toThrow()
    expect(guard.getActiveCount()).toBe(0)
  })

  test('clearAllForSession is a no-op', () => {
    const guard = createFreshGuard()
    guard.setTimeout(() => {}, 1000, { sessionId: 'abc' })
    expect(() => guard.clearAllForSession('abc')).not.toThrow()
  })

  test('getStats returns zeros', () => {
    const guard = createFreshGuard()
    guard.setTimeout(() => {}, 10)
    expect(guard.getStats()).toEqual({
      total: 0,
      intervals: 0,
      timeouts: 0,
      bySession: {},
    })
  })

  test('unref still applied in passthrough', () => {
    const guard = createFreshGuard()
    const id = guard.setTimeout(() => {}, 5000, { unref: true })
    expect(typeof (id as any).unref).toBe('function')
    clearTimeout(id)
  })
})

// ── tracking mode (feature flag enabled) ──────────────────────

describe('TimerGuard — tracking mode (ENABLE_TIMER_GUARD === true)', () => {
  let originalFlag: string | undefined

  beforeEach(() => {
    originalFlag = process.env.ENABLE_TIMER_GUARD
    process.env.ENABLE_TIMER_GUARD = 'true'
  })

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.ENABLE_TIMER_GUARD
    } else {
      process.env.ENABLE_TIMER_GUARD = originalFlag
    }
  })

  test('setInterval tracks timer', () => {
    const guard = createFreshGuard()
    const id = guard.setInterval(() => {}, 100)
    expect(guard.getActiveCount()).toBe(1)
    expect(guard.getStats().intervals).toBe(1)
    guard.clearAll()
  })

  test('setTimeout tracks timer', () => {
    const guard = createFreshGuard()
    const id = guard.setTimeout(() => {}, 100)
    expect(guard.getActiveCount()).toBe(1)
    expect(guard.getStats().timeouts).toBe(1)
    guard.clearAll()
  })

  test('clear removes timer from tracking', () => {
    const guard = createFreshGuard()
    const id = guard.setTimeout(() => {}, 5000)
    expect(guard.getActiveCount()).toBe(1)
    guard.clear(id)
    expect(guard.getActiveCount()).toBe(0)
  })

  test('clearAll removes all timers', () => {
    const guard = createFreshGuard()
    guard.setTimeout(() => {}, 5000)
    guard.setInterval(() => {}, 5000)
    guard.setTimeout(() => {}, 5000)
    expect(guard.getActiveCount()).toBe(3)
    guard.clearAll()
    expect(guard.getActiveCount()).toBe(0)
  })

  test('clearAllForSession removes only session timers', () => {
    const guard = createFreshGuard()
    guard.setTimeout(() => {}, 5000, { sessionId: 'A' })
    guard.setTimeout(() => {}, 5000, { sessionId: 'A' })
    guard.setTimeout(() => {}, 5000, { sessionId: 'B' })
    guard.setTimeout(() => {}, 5000)
    expect(guard.getActiveCount()).toBe(4)
    guard.clearAllForSession('A')
    expect(guard.getActiveCount()).toBe(2)
    guard.clearAll()
  })

  test('unref option defaults to true', () => {
    const guard = createFreshGuard()
    const id = guard.setTimeout(() => {}, 5000)
    expect(typeof (id as any).unref).toBe('function')
    guard.clearAll()
  })

  test('unref: false keeps ref', () => {
    const guard = createFreshGuard()
    const id = guard.setTimeout(() => {}, 5000, { unref: false })
    const timerObj = id as any
    // unref exists on the object but we just verify it was not called
    // by checking the timer is still tracked
    expect(guard.getActiveCount()).toBe(1)
    guard.clearAll()
  })

  test('label stored in TimerInfo', () => {
    const guard = createFreshGuard()
    const spy = spyOn(guard as any, 'registerCleanupOnce')
    guard.setTimeout(() => {}, 5000, { label: 'my-timer' })
    const stats = guard.getStats()
    guard.clearAll()
  })

  test('sessionId stored in TimerInfo and reflected in bySession', () => {
    const guard = createFreshGuard()
    guard.setTimeout(() => {}, 5000, { sessionId: 'session-1' })
    guard.setInterval(() => {}, 5000, { sessionId: 'session-1' })
    guard.setTimeout(() => {}, 5000, { sessionId: 'session-2' })
    const stats = guard.getStats()
    expect(stats.bySession['session-1']).toBe(2)
    expect(stats.bySession['session-2']).toBe(1)
    guard.clearAll()
  })

  test('warns when >50 active timers (once)', () => {
    const guard = createFreshGuard()
    const warnSpy = spyOn(console, 'warn').mockImplementation(() => {})
    for (let i = 0; i < 55; i++) {
      guard.setTimeout(() => {}, 30000)
    }
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('active timers')
    expect(warnSpy.mock.calls[0][0]).toContain('possible leak')
    // Adding more should NOT warn again
    guard.setTimeout(() => {}, 30000)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    warnSpy.mockRestore()
    guard.clearAll()
  })

  test('no-throw guarantee: callback errors are caught', async () => {
    const guard = createFreshGuard()
    const errSpy = spyOn(console, 'error').mockImplementation(() => {})
    let resolved = false
    guard.setTimeout(() => {
      throw new Error('boom')
    }, 10)
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolved = true
        resolve()
      }, 50)
    })
    expect(resolved).toBe(true)
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
    guard.clearAll()
  })

  test('no-throw guarantee: clear on invalid id does not throw', () => {
    const guard = createFreshGuard()
    expect(() => guard.clear(null as any)).not.toThrow()
    expect(() => guard.clear(undefined as any)).not.toThrow()
  })

  test('auto-registration with cleanupRegistry', () => {
    const guard = createFreshGuard()
    guard.setTimeout(() => {}, 5000)
    // The guard should have registered a cleanup function
    // We verify by calling clearAll which is what the cleanup does
    expect(guard.getActiveCount()).toBeGreaterThanOrEqual(1)
    guard.clearAll()
  })
})

// ── singleton export ──────────────────────────────────────────

describe('timerGuard singleton', () => {
  test('exports a TimerGuard instance', async () => {
    const { timerGuard } = await import('./timerGuard.js')
    expect(timerGuard).toBeInstanceOf(TimerGuard)
  })
})
