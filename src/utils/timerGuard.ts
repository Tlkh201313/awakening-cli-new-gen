/**
 * TimerGuard — tracks all setTimeout/setInterval calls so they can be
 * cleared en-masse during graceful shutdown. Prevents dangling timers
 * from keeping the process alive.
 *
 * Feature flag: process.env.ENABLE_TIMER_GUARD === 'true'
 * When disabled, all methods delegate to native calls (passthrough mode).
 */

import { registerCleanup } from './cleanupRegistry.js'

export interface TimerOptions {
  unref?: boolean
  label?: string
  sessionId?: string
}

export interface TimerInfo {
  id: NodeJS.Timeout
  type: 'timeout' | 'interval'
  label?: string
  sessionId?: string
  createdAt: number
}

const WARN_THRESHOLD = 50

export class TimerGuard {
  private timers = new Map<NodeJS.Timeout, TimerInfo>()
  private warned = false
  private cleanupRegistered = false

  // ── public API ──────────────────────────────────────────────

  setInterval(
    fn: () => void,
    ms: number,
    options?: TimerOptions,
  ): NodeJS.Timeout {
    return this.guarded('interval', fn, ms, options)
  }

  setTimeout(
    fn: () => void,
    ms: number,
    options?: TimerOptions,
  ): NodeJS.Timeout {
    return this.guarded('timeout', fn, ms, options)
  }

  clear(id: NodeJS.Timeout): void {
    try {
      if (this.isPassthrough()) {
        clearTimeout(id)
        return
      }
      const info = this.timers.get(id)
      if (info) {
        info.type === 'interval' ? clearInterval(id) : clearTimeout(id)
        this.timers.delete(id)
      }
    } catch (err) {
      console.error('[TimerGuard] clear failed:', err)
    }
  }

  clearAll(): void {
    try {
      if (this.isPassthrough()) return
      for (const [id, info] of this.timers) {
        info.type === 'interval' ? clearInterval(id) : clearTimeout(id)
      }
      this.timers.clear()
    } catch (err) {
      console.error('[TimerGuard] clearAll failed:', err)
    }
  }

  clearAllForSession(sessionId: string): void {
    try {
      if (this.isPassthrough()) return
      for (const [id, info] of this.timers) {
        if (info.sessionId === sessionId) {
          info.type === 'interval' ? clearInterval(id) : clearTimeout(id)
          this.timers.delete(id)
        }
      }
    } catch (err) {
      console.error('[TimerGuard] clearAllForSession failed:', err)
    }
  }

  getActiveCount(): number {
    if (this.isPassthrough()) return 0
    return this.timers.size
  }

  getStats(): {
    total: number
    intervals: number
    timeouts: number
    bySession: Record<string, number>
  } {
    if (this.isPassthrough()) {
      return { total: 0, intervals: 0, timeouts: 0, bySession: {} }
    }
    let intervals = 0
    let timeouts = 0
    const bySession: Record<string, number> = {}
    for (const info of this.timers.values()) {
      if (info.type === 'interval') intervals++
      else timeouts++
      if (info.sessionId) {
        bySession[info.sessionId] = (bySession[info.sessionId] ?? 0) + 1
      }
    }
    return { total: this.timers.size, intervals, timeouts, bySession }
  }

  // ── internal ────────────────────────────────────────────────

  private isPassthrough(): boolean {
    return process.env.ENABLE_TIMER_GUARD !== 'true'
  }

  private registerCleanupOnce(): void {
    if (this.cleanupRegistered || this.isPassthrough()) return
    this.cleanupRegistered = true
    registerCleanup(async () => {
      this.clearAll()
    })
  }

  private guarded(
    type: 'timeout' | 'interval',
    fn: () => void,
    ms: number,
    options?: TimerOptions,
  ): NodeJS.Timeout {
    try {
      if (this.isPassthrough()) {
        const id = type === 'interval' ? setInterval(fn, ms) : setTimeout(fn, ms)
        if (options?.unref !== false && typeof id === 'object' && id.unref) {
          id.unref()
        }
        return id
      }

      this.registerCleanupOnce()

      const wrappedFn = () => {
        try {
          fn()
        } catch (err) {
          console.error(`[TimerGuard] timer callback error (${options?.label ?? 'unnamed'}):`, err)
        }
      }

      const id = type === 'interval' ? setInterval(wrappedFn, ms) : setTimeout(wrappedFn, ms)

      const shouldUnref = options?.unref !== false
      if (shouldUnref && typeof id === 'object' && id.unref) {
        id.unref()
      }

      const info: TimerInfo = {
        id,
        type,
        label: options?.label,
        sessionId: options?.sessionId,
        createdAt: Date.now(),
      }
      this.timers.set(id, info)

      if (!this.warned && this.timers.size > WARN_THRESHOLD) {
        this.warned = true
        console.warn(
          `[TimerGuard] ${this.timers.size} active timers — possible leak`,
        )
      }

      return id
    } catch (err) {
      console.error('[TimerGuard] guarded failed:', err)
      // Fallback: return a no-op timer so caller never gets undefined
      const fallback = setTimeout(() => {}, 0)
      if (typeof fallback === 'object' && fallback.unref) fallback.unref()
      return fallback
    }
  }
}

export const timerGuard = new TimerGuard()
