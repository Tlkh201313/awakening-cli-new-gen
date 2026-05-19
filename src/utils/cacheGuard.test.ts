import { afterEach, beforeEach, describe, expect, test, spyOn } from 'bun:test'
import { registerCleanup } from './cleanupRegistry.js'
import { CacheGuard } from './cacheGuard.js'

function createFreshGuard(): CacheGuard {
  return new CacheGuard()
}

// ── passthrough mode (feature flag disabled) ──────────────────

describe('CacheGuard — passthrough mode (ENABLE_CACHE_GUARD !== true)', () => {
  test('register is a no-op and does not track cache', () => {
    const guard = createFreshGuard()
    const mockCache = { clear: () => {} }
    guard.register(mockCache)
    expect(guard.getActiveCount()).toBe(0)
  })

  test('clear delegates to native cache.clear() directly', () => {
    const guard = createFreshGuard()
    let cleared = false
    const mockCache = {
      clear: () => {
        cleared = true
      },
    }
    guard.clear(mockCache)
    expect(cleared).toBe(true)
  })

  test('clearAll is a no-op', () => {
    const guard = createFreshGuard()
    let cleared = false
    const mockCache = {
      clear: () => {
        cleared = true
      },
    }
    guard.register(mockCache)
    guard.clearAll()
    expect(cleared).toBe(false)
  })

  test('clearAllForSession is a no-op', () => {
    const guard = createFreshGuard()
    let cleared = false
    const mockCache = {
      clear: () => {
        cleared = true
      },
    }
    guard.register(mockCache, { sessionId: 'abc' })
    guard.clearAllForSession('abc')
    expect(cleared).toBe(false)
  })

  test('getStats returns zeros', () => {
    const guard = createFreshGuard()
    const mockCache = { clear: () => {}, size: 5 }
    guard.register(mockCache)
    expect(guard.getStats()).toEqual({
      total: 0,
      bySession: {},
      details: [],
    })
  })
})

// ── tracking mode (feature flag enabled) ──────────────────────

describe('CacheGuard — tracking mode (ENABLE_CACHE_GUARD === true)', () => {
  let originalFlag: string | undefined

  beforeEach(() => {
    originalFlag = process.env.ENABLE_CACHE_GUARD
    process.env.ENABLE_CACHE_GUARD = 'true'
  })

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.ENABLE_CACHE_GUARD
    } else {
      process.env.ENABLE_CACHE_GUARD = originalFlag
    }
  })

  test('register tracks cache and gets correct count', () => {
    const guard = createFreshGuard()
    const mockCache = { clear: () => {} }
    guard.register(mockCache)
    expect(guard.getActiveCount()).toBe(1)
  })

  test('deregister removes cache from tracking', () => {
    const guard = createFreshGuard()
    const mockCache = { clear: () => {} }
    guard.register(mockCache)
    expect(guard.getActiveCount()).toBe(1)
    guard.deregister(mockCache)
    expect(guard.getActiveCount()).toBe(0)
  })

  test('clear clears specific cache', () => {
    const guard = createFreshGuard()
    let cleared = false
    const mockCache = {
      clear: () => {
        cleared = true
      },
    }
    guard.register(mockCache)
    guard.clear(mockCache)
    expect(cleared).toBe(true)
  })

  test('clearAll clears all tracked caches', () => {
    const guard = createFreshGuard()
    let clearedCount = 0
    const mockCache1 = {
      clear: () => {
        clearedCount++
      },
    }
    const mockCache2 = {
      clear: () => {
        clearedCount++
      },
    }
    guard.register(mockCache1)
    guard.register(mockCache2)
    guard.clearAll()
    expect(clearedCount).toBe(2)
  })

  test('clearAllForSession clears only matching session caches', () => {
    const guard = createFreshGuard()
    let clearedA = false
    let clearedB = false

    const cacheA = {
      clear: () => {
        clearedA = true
      },
    }
    const cacheB = {
      clear: () => {
        clearedB = true
      },
    }

    guard.register(cacheA, { sessionId: 'A' })
    guard.register(cacheB, { sessionId: 'B' })

    guard.clearAllForSession('A')
    expect(clearedA).toBe(true)
    expect(clearedB).toBe(false)
  })

  test('getStats returns accurate stats with sizes, maxSizes and isOverSize', () => {
    const guard = createFreshGuard()
    const mockCacheMap = new Map<string, string>()
    mockCacheMap.set('key1', 'value1')

    const mockCustomCache = {
      clear: () => {},
      size: () => 10,
    }

    const mockLengthCache = {
      clear: () => {},
      length: 100,
    }

    guard.register(mockCacheMap, {
      label: 'map-cache',
      sessionId: 'session-1',
      maxSize: 0,
    })
    guard.register(mockCustomCache, {
      label: 'custom-cache',
      sessionId: 'session-1',
      maxSize: 20,
    })
    guard.register(mockLengthCache, {
      label: 'length-cache',
      sessionId: 'session-2',
    })

    const stats = guard.getStats()
    expect(stats.total).toBe(3)
    expect(stats.bySession['session-1']).toBe(2)
    expect(stats.bySession['session-2']).toBe(1)

    const mapDetail = stats.details.find((d) => d.label === 'map-cache')
    expect(mapDetail).toBeDefined()
    expect(mapDetail?.size).toBe(1)
    expect(mapDetail?.maxSize).toBe(0)
    expect(mapDetail?.isOverSize).toBe(true)

    const customDetail = stats.details.find((d) => d.label === 'custom-cache')
    expect(customDetail).toBeDefined()
    expect(customDetail?.size).toBe(10)
    expect(customDetail?.maxSize).toBe(20)
    expect(customDetail?.isOverSize).toBe(false)

    const lengthDetail = stats.details.find((d) => d.label === 'length-cache')
    expect(lengthDetail).toBeDefined()
    expect(lengthDetail?.size).toBe(100)
    expect(lengthDetail?.maxSize).toBeUndefined()
    expect(lengthDetail?.isOverSize).toBe(false)
  })

  test('warns when >50 active caches (once)', () => {
    const guard = createFreshGuard()
    const warnSpy = spyOn(console, 'warn').mockImplementation(() => {})

    for (let i = 0; i < 55; i++) {
      guard.register({ clear: () => {} })
    }

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('active caches')
    expect(warnSpy.mock.calls[0][0]).toContain('possible leak')

    // Adding more should NOT warn again
    guard.register({ clear: () => {} })
    expect(warnSpy).toHaveBeenCalledTimes(1)

    warnSpy.mockRestore()
  })

  test('throws/logs error on invalid cache registration', () => {
    const guard = createFreshGuard()
    const errSpy = spyOn(console, 'error').mockImplementation(() => {})

    guard.register(null)
    guard.register({})
    guard.register({ noClearMethod: true })

    expect(errSpy).toHaveBeenCalledTimes(3)
    errSpy.mockRestore()
  })

  test('no-throw guarantee: clear errors are caught', () => {
    const guard = createFreshGuard()
    const errSpy = spyOn(console, 'error').mockImplementation(() => {})

    const badCache = {
      clear: () => {
        throw new Error('fail')
      },
    }

    guard.register(badCache)
    expect(() => guard.clearAll()).not.toThrow()
    expect(errSpy).toHaveBeenCalled()

    errSpy.mockRestore()
  })

  test('no-throw guarantee: clearAllForSession errors are caught', () => {
    const guard = createFreshGuard()
    const errSpy = spyOn(console, 'error').mockImplementation(() => {})

    const badCache = {
      clear: () => {
        throw new Error('fail')
      },
    }

    guard.register(badCache, { sessionId: 'A' })
    expect(() => guard.clearAllForSession('A')).not.toThrow()
    expect(errSpy).toHaveBeenCalled()

    errSpy.mockRestore()
  })
})

// ── singleton export ──────────────────────────────────────────

describe('cacheGuard singleton', () => {
  test('exports a CacheGuard instance', async () => {
    const { cacheGuard } = await import('./cacheGuard.js')
    expect(cacheGuard).toBeInstanceOf(CacheGuard)
  })
})
