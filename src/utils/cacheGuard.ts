/**
 * CacheGuard — tracks all in-memory caches (Map, Set, custom cache objects)
 * so they can be cleared en-masse during graceful shutdown or session termination.
 * Prevents memory accumulation and dangling references in process-lifetime caches.
 *
 * Feature flag: process.env.ENABLE_CACHE_GUARD === 'true'
 * When disabled, all methods delegate to no-op or direct passthrough calls.
 */

import { registerCleanup } from './cleanupRegistry.js'

export interface CacheOptions {
  label?: string
  sessionId?: string
  maxSize?: number
}

export interface CacheInfo {
  cache: any
  label?: string
  sessionId?: string
  maxSize?: number
  registeredAt: number
}

const WARN_THRESHOLD = 50

export class CacheGuard {
  private caches = new Map<any, CacheInfo>()
  private warned = false
  private cleanupRegistered = false

  // ── public API ──────────────────────────────────────────────

  register(cache: any, options?: CacheOptions): void {
    try {
      if (this.isPassthrough()) {
        return
      }

      if (!cache || typeof cache.clear !== 'function') {
        throw new Error('Cache must be an object with a clear() method')
      }

      this.registerCleanupOnce()

      const info: CacheInfo = {
        cache,
        label: options?.label,
        sessionId: options?.sessionId,
        maxSize: options?.maxSize,
        registeredAt: Date.now(),
      }
      this.caches.set(cache, info)

      if (!this.warned && this.caches.size > WARN_THRESHOLD) {
        this.warned = true
        console.warn(
          `[CacheGuard] ${this.caches.size} active caches — possible leak`,
        )
      }
    } catch (err) {
      console.error('[CacheGuard] register failed:', err)
    }
  }

  deregister(cache: any): void {
    try {
      if (this.isPassthrough()) return
      this.caches.delete(cache)
    } catch (err) {
      console.error('[CacheGuard] deregister failed:', err)
    }
  }

  clear(cache: any): void {
    try {
      if (this.isPassthrough()) {
        if (cache && typeof cache.clear === 'function') {
          cache.clear()
        }
        return
      }
      const info = this.caches.get(cache)
      if (info) {
        info.cache.clear()
      } else if (cache && typeof cache.clear === 'function') {
        cache.clear()
      }
    } catch (err) {
      console.error('[CacheGuard] clear failed:', err)
    }
  }

  clearAll(): void {
    try {
      if (this.isPassthrough()) return
      for (const info of this.caches.values()) {
        try {
          info.cache.clear()
        } catch (err) {
          console.error(
            `[CacheGuard] failed to clear cache (${info.label ?? 'unnamed'}):`,
            err,
          )
        }
      }
    } catch (err) {
      console.error('[CacheGuard] clearAll failed:', err)
    }
  }

  clearAllForSession(sessionId: string): void {
    try {
      if (this.isPassthrough()) return
      for (const [cache, info] of this.caches.entries()) {
        if (info.sessionId === sessionId) {
          try {
            info.cache.clear()
          } catch (err) {
            console.error(
              `[CacheGuard] failed to clear cache for session ${sessionId} (${
                info.label ?? 'unnamed'
              }):`,
              err,
            )
          }
        }
      }
    } catch (err) {
      console.error('[CacheGuard] clearAllForSession failed:', err)
    }
  }

  getActiveCount(): number {
    if (this.isPassthrough()) return 0
    return this.caches.size
  }

  getStats(): {
    total: number
    bySession: Record<string, number>
    details: Array<{
      label?: string
      sessionId?: string
      size: number
      maxSize?: number
      isOverSize: boolean
    }>
  } {
    if (this.isPassthrough()) {
      return { total: 0, bySession: {}, details: [] }
    }

    const bySession: Record<string, number> = {}
    const details: Array<{
      label?: string
      sessionId?: string
      size: number
      maxSize?: number
      isOverSize: boolean
    }> = []

    for (const info of this.caches.values()) {
      if (info.sessionId) {
        bySession[info.sessionId] = (bySession[info.sessionId] ?? 0) + 1
      }

      let size = -1
      if (typeof info.cache.size === 'number') {
        size = info.cache.size
      } else if (typeof info.cache.size === 'function') {
        try {
          size = info.cache.size()
        } catch {}
      } else if (typeof info.cache.length === 'number') {
        size = info.cache.length
      }

      const isOverSize = info.maxSize !== undefined && size > info.maxSize

      details.push({
        label: info.label,
        sessionId: info.sessionId,
        size,
        maxSize: info.maxSize,
        isOverSize,
      })
    }

    return { total: this.caches.size, bySession, details }
  }

  // ── internal ────────────────────────────────────────────────

  private isPassthrough(): boolean {
    return process.env.ENABLE_CACHE_GUARD !== 'true'
  }

  private registerCleanupOnce(): void {
    if (this.cleanupRegistered || this.isPassthrough()) return
    this.cleanupRegistered = true
    registerCleanup(async () => {
      this.clearAll()
      this.caches.clear()
    })
  }
}

export const cacheGuard = new CacheGuard()
