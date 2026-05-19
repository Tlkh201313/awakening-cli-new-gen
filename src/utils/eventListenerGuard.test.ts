import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { EventEmitter } from 'events'
import { registerCleanup } from './cleanupRegistry.js'
import { EventListenerGuard } from './eventListenerGuard.js'

function createFreshGuard(): EventListenerGuard {
  return new EventListenerGuard()
}

// ── passthrough mode (feature flag disabled) ──────────────────

describe('EventListenerGuard — passthrough mode (ENABLE_EVENT_LISTENER_GUARD !== true)', () => {
  test('add delegates to native EventEmitter.on', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    let called = false
    guard.add(emitter, 'test', () => {
      called = true
    })
    emitter.emit('test')
    expect(called).toBe(true)
    expect(guard.getListenerCount(emitter)).toBe(0)
    emitter.removeAllListeners()
  })

  test('remove delegates to native EventEmitter.off', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    const handler = () => {}
    expect(() => guard.remove(emitter, 'test', handler)).not.toThrow()
  })

  test('removeAll delegates to native removeAllListeners', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    emitter.on('a', () => {})
    emitter.on('b', () => {})
    expect(() => guard.removeAll(emitter)).not.toThrow()
  })

  test('removeAllForSession is a no-op', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    guard.add(emitter, 'test', () => {}, { sessionId: 'abc' })
    expect(() => guard.removeAllForSession('abc')).not.toThrow()
    expect(guard.getListenerCount(emitter)).toBe(0)
  })

  test('getStats returns zeros', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    guard.add(emitter, 'test', () => {})
    expect(guard.getStats()).toEqual({ total: 0, byEmitter: {}, bySession: {} })
    emitter.removeAllListeners()
  })

  test('add with EventTarget-like object', () => {
    const guard = createFreshGuard()
    let called = false
    const target = {
      _handlers: new Map<string, Set<EventListener>>(),
      addEventListener(event: string, handler: EventListener) {
        if (!this._handlers.has(event)) this._handlers.set(event, new Set())
        this._handlers.get(event)!.add(handler)
      },
      removeEventListener(event: string, handler: EventListener) {
        this._handlers.get(event)?.delete(handler)
      },
      dispatchEvent(event: string) {
        this._handlers.get(event)?.forEach((h) => h({ type: event } as Event))
      },
    }
    const handler = () => {
      called = true
    }
    guard.add(target as unknown as EventTarget, 'click', handler)
    target.dispatchEvent('click')
    expect(called).toBe(true)
  })
})

// ── tracking mode (feature flag enabled) ──────────────────────

describe('EventListenerGuard — tracking mode (ENABLE_EVENT_LISTENER_GUARD === true)', () => {
  let originalFlag: string | undefined

  beforeEach(() => {
    originalFlag = process.env.ENABLE_EVENT_LISTENER_GUARD
    process.env.ENABLE_EVENT_LISTENER_GUARD = 'true'
  })

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.ENABLE_EVENT_LISTENER_GUARD
    } else {
      process.env.ENABLE_EVENT_LISTENER_GUARD = originalFlag
    }
  })

  test('add/remove with EventEmitter', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    let called = false
    const handler = () => {
      called = true
    }
    guard.add(emitter, 'test', handler)
    expect(guard.getListenerCount(emitter)).toBe(1)
    expect(guard.getListenerCount(emitter, 'test')).toBe(1)
    expect(guard.getListenerCount(emitter, 'other')).toBe(0)

    emitter.emit('test')
    expect(called).toBe(true)

    guard.remove(emitter, 'test', handler)
    expect(guard.getListenerCount(emitter)).toBe(0)
  })

  test('add/remove with EventTarget-like object', () => {
    const guard = createFreshGuard()
    const target = new EventTarget()
    let called = false
    const handler = () => {
      called = true
    }
    guard.add(target, 'click', handler)
    expect(guard.getListenerCount(target)).toBe(1)

    target.dispatchEvent(new Event('click'))
    expect(called).toBe(true)

    guard.remove(target, 'click', handler)
    expect(guard.getListenerCount(target)).toBe(0)
  })

  test('removeAll for an emitter', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    guard.add(emitter, 'a', () => {})
    guard.add(emitter, 'b', () => {})
    guard.add(emitter, 'c', () => {})
    expect(guard.getListenerCount(emitter)).toBe(3)

    guard.removeAll(emitter)
    expect(guard.getListenerCount(emitter)).toBe(0)
  })

  test('removeAllForSession', () => {
    const guard = createFreshGuard()
    const e1 = new EventEmitter()
    const e2 = new EventEmitter()
    guard.add(e1, 'test', () => {}, { sessionId: 'A' })
    guard.add(e1, 'test2', () => {}, { sessionId: 'A' })
    guard.add(e2, 'test', () => {}, { sessionId: 'B' })
    guard.add(e2, 'test2', () => {})
    expect(guard.getStats().total).toBe(4)

    guard.removeAllForSession('A')
    expect(guard.getStats().total).toBe(2)
    expect(guard.getListenerCount(e1)).toBe(0)
    expect(guard.getListenerCount(e2)).toBe(2)

    guard.removeAllForSession('B')
    expect(guard.getStats().total).toBe(1)

    guard.removeAll(e2)
  })

  test('warns when >100 listeners on single emitter (once)', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    const warnSpy = spyOn(console, 'warn').mockImplementation(() => {})

    for (let i = 0; i < 105; i++) {
      guard.add(emitter, 'data', () => {})
    }

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('listeners')
    expect(warnSpy.mock.calls[0][0]).toContain('possible leak')

    // Adding more should NOT warn again
    guard.add(emitter, 'data', () => {})
    expect(warnSpy).toHaveBeenCalledTimes(1)

    warnSpy.mockRestore()
    guard.removeAll(emitter)
  })

  test('warn threshold is per-emitter', () => {
    const guard = createFreshGuard()
    const e1 = new EventEmitter()
    const e2 = new EventEmitter()
    const warnSpy = spyOn(console, 'warn').mockImplementation(() => {})

    for (let i = 0; i < 105; i++) {
      guard.add(e1, 'data', () => {})
    }
    expect(warnSpy).toHaveBeenCalledTimes(1)

    for (let i = 0; i < 105; i++) {
      guard.add(e2, 'data', () => {})
    }
    expect(warnSpy).toHaveBeenCalledTimes(2)

    warnSpy.mockRestore()
    guard.removeAll(e1)
    guard.removeAll(e2)
  })

  test('getListenerCount', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    guard.add(emitter, 'a', () => {})
    guard.add(emitter, 'a', () => {})
    guard.add(emitter, 'b', () => {})

    expect(guard.getListenerCount(emitter)).toBe(3)
    expect(guard.getListenerCount(emitter, 'a')).toBe(2)
    expect(guard.getListenerCount(emitter, 'b')).toBe(1)
    expect(guard.getListenerCount(emitter, 'c')).toBe(0)

    guard.removeAll(emitter)
  })

  test('getStats', () => {
    const guard = createFreshGuard()
    const e1 = new EventEmitter()
    const e2 = new EventEmitter()
    guard.add(e1, 'test', () => {}, { sessionId: 's1' })
    guard.add(e1, 'test2', () => {}, { sessionId: 's1' })
    guard.add(e2, 'test', () => {}, { sessionId: 's2' })

    const stats = guard.getStats()
    expect(stats.total).toBe(3)
    expect(Object.keys(stats.byEmitter).length).toBe(2)
    expect(stats.bySession['s1']).toBe(2)
    expect(stats.bySession['s2']).toBe(1)

    guard.removeAll(e1)
    guard.removeAll(e2)
  })

  test('no-throw guarantee: add with invalid emitter', () => {
    const guard = createFreshGuard()
    expect(() => guard.add(null as any, 'test', () => {})).not.toThrow()
    expect(() => guard.add(undefined as any, 'test', () => {})).not.toThrow()
  })

  test('no-throw guarantee: remove with invalid emitter', () => {
    const guard = createFreshGuard()
    expect(() => guard.remove(null as any, 'test', () => {})).not.toThrow()
    expect(() => guard.remove(undefined as any, 'test', () => {})).not.toThrow()
  })

  test('no-throw guarantee: removeAll with invalid emitter', () => {
    const guard = createFreshGuard()
    expect(() => guard.removeAll(null as any)).not.toThrow()
    expect(() => guard.removeAll(undefined as any)).not.toThrow()
  })

  test('no-throw guarantee: removeAllForSession', () => {
    const guard = createFreshGuard()
    expect(() => guard.removeAllForSession('nonexistent')).not.toThrow()
  })

  test('auto-registration with cleanupRegistry', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    guard.add(emitter, 'test', () => {})

    // The guard should have registered a cleanup function
    expect(guard.getStats().total).toBeGreaterThanOrEqual(1)
    guard.removeAll(emitter)
  })

  test('removing a listener that was not tracked is safe', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    const handler = () => {}
    emitter.on('test', handler)
    expect(() => guard.remove(emitter, 'test', handler)).not.toThrow()
    expect(guard.getListenerCount(emitter)).toBe(0)
    emitter.removeAllListeners()
  })

  test('symbol events are supported', () => {
    const guard = createFreshGuard()
    const emitter = new EventEmitter()
    const sym = Symbol('custom')
    let called = false
    const handler = () => {
      called = true
    }
    guard.add(emitter, sym, handler)
    expect(guard.getListenerCount(emitter, sym)).toBe(1)
    emitter.emit(sym)
    expect(called).toBe(true)
    guard.remove(emitter, sym, handler)
    expect(guard.getListenerCount(emitter, sym)).toBe(0)
  })
})

// ── singleton export ──────────────────────────────────────────

describe('eventListenerGuard singleton', () => {
  test('exports an EventListenerGuard instance', async () => {
    const { eventListenerGuard } = await import('./eventListenerGuard.js')
    expect(eventListenerGuard).toBeInstanceOf(EventListenerGuard)
  })
})
