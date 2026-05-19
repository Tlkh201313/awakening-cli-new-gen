/**
 * EventListenerGuard — tracks all event listener registrations so they can be
 * removed en-masse during graceful shutdown. Prevents dangling listeners
 * from keeping references alive and causing memory leaks.
 *
 * Feature flag: process.env.ENABLE_EVENT_LISTENER_GUARD === 'true'
 * When disabled, all methods delegate to native calls (passthrough mode).
 */

import { registerCleanup } from './cleanupRegistry.js'
import { EventEmitter } from 'events'

export type EventEmitterLike =
  | EventEmitter
  | EventTarget
  | { on: Function; off: Function; removeAllListeners?: Function; removeEventListener?: Function }

export interface ListenerInfo {
  emitter: EventEmitterLike
  event: string | symbol
  handler: (...args: unknown[]) => void
  sessionId?: string
  addedAt: number
}

const WARN_THRESHOLD = 100
const emitterIdMap = new WeakMap<EventEmitterLike, number>()
let nextEmitterId = 0

export class EventListenerGuard {
  private emitters: ListenerInfo[] = []
  private warnedEmitters = new Set<string>()
  private cleanupRegistered = false

  // ── public API ──────────────────────────────────────────────

  add(
    emitter: EventEmitterLike,
    event: string | symbol,
    handler: (...args: unknown[]) => void,
    options?: { sessionId?: string },
  ): void {
    try {
      if (this.isPassthrough()) {
        this.nativeAdd(emitter, event, handler)
        return
      }

      this.registerCleanupOnce()

      this.nativeAdd(emitter, event, handler)

      const info: ListenerInfo = {
        emitter,
        event,
        handler,
        sessionId: options?.sessionId,
        addedAt: Date.now(),
      }
      this.emitters.push(info)

      const key = this.emitterKey(emitter)
      const count = this.getListenerCount(emitter)
      if (!this.warnedEmitters.has(key) && count > WARN_THRESHOLD) {
        this.warnedEmitters.add(key)
        console.warn(
          `[EventListenerGuard] ${count} listeners on emitter "${String(key)}" — possible leak`,
        )
      }
    } catch (err) {
      console.error('[EventListenerGuard] add failed:', err)
    }
  }

  remove(
    emitter: EventEmitterLike,
    event: string | symbol,
    handler: (...args: unknown[]) => void,
  ): void {
    try {
      if (this.isPassthrough()) {
        this.nativeRemove(emitter, event, handler)
        return
      }

      this.nativeRemove(emitter, event, handler)

      const idx = this.emitters.findIndex(
        (info) => info.emitter === emitter && info.event === event && info.handler === handler,
      )
      if (idx !== -1) {
        this.emitters.splice(idx, 1)
      }
    } catch (err) {
      console.error('[EventListenerGuard] remove failed:', err)
    }
  }

  removeAll(emitter: EventEmitterLike): void {
    try {
      if (this.isPassthrough()) {
        this.nativeRemoveAll(emitter)
        return
      }

      const tracked = this.emitters.filter((info) => info.emitter === emitter)
      for (const info of tracked) {
        this.nativeRemove(info.emitter, info.event, info.handler)
      }
      this.emitters = this.emitters.filter((info) => info.emitter !== emitter)
    } catch (err) {
      console.error('[EventListenerGuard] removeAll failed:', err)
    }
  }

  removeAllForSession(sessionId: string): void {
    try {
      if (this.isPassthrough()) return

      const tracked = this.emitters.filter((info) => info.sessionId === sessionId)
      for (const info of tracked) {
        this.nativeRemove(info.emitter, info.event, info.handler)
      }
      this.emitters = this.emitters.filter((info) => info.sessionId !== sessionId)
    } catch (err) {
      console.error('[EventListenerGuard] removeAllForSession failed:', err)
    }
  }

  getListenerCount(emitter: EventEmitterLike, event?: string | symbol): number {
    try {
      if (this.isPassthrough()) return 0

      let count = 0
      for (const info of this.emitters) {
        if (info.emitter === emitter) {
          if (event === undefined || info.event === event) {
            count++
          }
        }
      }
      return count
    } catch (err) {
      console.error('[EventListenerGuard] getListenerCount failed:', err)
      return 0
    }
  }

  getStats(): {
    total: number
    byEmitter: Record<string, number>
    bySession: Record<string, number>
  } {
    if (this.isPassthrough()) {
      return { total: 0, byEmitter: {}, bySession: {} }
    }

    const byEmitter: Record<string, number> = {}
    const bySession: Record<string, number> = {}

    for (const info of this.emitters) {
      const eKey = this.emitterKey(info.emitter)
      byEmitter[eKey] = (byEmitter[eKey] ?? 0) + 1

      if (info.sessionId) {
        bySession[info.sessionId] = (bySession[info.sessionId] ?? 0) + 1
      }
    }

    return { total: this.emitters.length, byEmitter, bySession }
  }

  // ── internal ────────────────────────────────────────────────

  private isPassthrough(): boolean {
    return process.env.ENABLE_EVENT_LISTENER_GUARD !== 'true'
  }

  private registerCleanupOnce(): void {
    if (this.cleanupRegistered || this.isPassthrough()) return
    this.cleanupRegistered = true
    registerCleanup(async () => {
      this.removeAllTracked()
    })
  }

  private removeAllTracked(): void {
    try {
      for (const info of this.emitters) {
        this.nativeRemove(info.emitter, info.event, info.handler)
      }
      this.emitters = []
    } catch (err) {
      console.error('[EventListenerGuard] cleanup failed:', err)
    }
  }

  private nativeAdd(
    emitter: EventEmitterLike,
    event: string | symbol,
    handler: (...args: unknown[]) => void,
  ): void {
    if (!emitter || typeof emitter !== 'object') return
    if (isEventTarget(emitter)) {
      emitter.addEventListener(event as string, handler as EventListener)
    } else if (isEventEmitter(emitter)) {
      emitter.on(event, handler)
    } else {
      ;(emitter as { on: Function }).on(event, handler)
    }
  }

  private nativeRemove(
    emitter: EventEmitterLike,
    event: string | symbol,
    handler: (...args: unknown[]) => void,
  ): void {
    if (!emitter || typeof emitter !== 'object') return
    if (isEventTarget(emitter)) {
      emitter.removeEventListener(event as string, handler as EventListener)
    } else if (isEventEmitter(emitter)) {
      emitter.off(event, handler)
    } else {
      ;(emitter as { off: Function }).off(event, handler)
    }
  }

  private nativeRemoveAll(emitter: EventEmitterLike): void {
    if (!emitter || typeof emitter !== 'object') return
    if (isEventEmitter(emitter) && typeof emitter.removeAllListeners === 'function') {
      emitter.removeAllListeners()
    } else if (isEventTarget(emitter)) {
      // EventTarget has no removeAll — remove tracked ones only
      const tracked = this.emitters.filter((info) => info.emitter === emitter)
      for (const info of tracked) {
        emitter.removeEventListener(info.event as string, info.handler as EventListener)
      }
    } else if (typeof (emitter as { removeAllListeners?: Function }).removeAllListeners === 'function') {
      ;(emitter as { removeAllListeners: Function }).removeAllListeners()
    }
  }

  private emitterKey(emitter: EventEmitterLike): string {
    if (!emitter || typeof emitter !== 'object') return String(emitter)
    let id = emitterIdMap.get(emitter)
    if (id === undefined) {
      id = nextEmitterId++
      emitterIdMap.set(emitter, id)
    }
    return `emitter#${id}`
  }
}

function isEventTarget(emitter: EventEmitterLike): emitter is EventTarget {
  return (
    emitter != null &&
    typeof (emitter as EventTarget).addEventListener === 'function' &&
    typeof (emitter as EventTarget).removeEventListener === 'function' &&
    !(emitter instanceof EventEmitter)
  )
}

function isEventEmitter(emitter: EventEmitterLike): emitter is EventEmitter {
  return emitter instanceof EventEmitter
}

export const eventListenerGuard = new EventListenerGuard()
