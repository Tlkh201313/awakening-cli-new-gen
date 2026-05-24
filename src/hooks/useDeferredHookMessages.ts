import { useCallback, useEffect, useRef } from 'react'
import type { HookResultMessage, Message } from '../types/message.js'
import { logForDebugging } from '../utils/debug.js'

/**
 * Manages deferred SessionStart hook messages so the REPL can render
 * immediately instead of blocking on hook execution (~500ms).
 *
 * Hook messages are injected asynchronously when the promise resolves.
 * Returns a callback that onSubmit should call before the first API
 * request to ensure the model always sees hook context.
 */

const DEFAULT_DEFERRED_HOOK_WAIT_MS = 2_000

function getDeferredHookWaitMs(): number {
  const raw = process.env.CLAUDE_CODE_DEFERRED_HOOK_WAIT_MS?.trim()
  if (raw === '0') return Number.POSITIVE_INFINITY
  if (!raw) return DEFAULT_DEFERRED_HOOK_WAIT_MS
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 0) return DEFAULT_DEFERRED_HOOK_WAIT_MS
  return n
}

function applyHookMessages(
  msgs: HookResultMessage[],
  setMessages: (action: React.SetStateAction<Message[]>) => void,
): void {
  if (msgs.length > 0) {
    setMessages(prev => [...msgs, ...prev])
  }
}

export function useDeferredHookMessages(
  pendingHookMessages: Promise<HookResultMessage[]> | undefined,
  setMessages: (action: React.SetStateAction<Message[]>) => void,
): () => Promise<void> {
  const pendingRef = useRef(pendingHookMessages ?? null)
  const resolvedRef = useRef(!pendingHookMessages)
  const gaveUpWaitingRef = useRef(false)

  useEffect(() => {
    pendingRef.current = pendingHookMessages ?? null
    if (!pendingHookMessages) {
      resolvedRef.current = true
      return
    }
    resolvedRef.current = false
    gaveUpWaitingRef.current = false
  }, [pendingHookMessages])

  useEffect(() => {
    const promise = pendingRef.current
    if (!promise) return
    let cancelled = false
    promise.then(msgs => {
      if (cancelled) return
      resolvedRef.current = true
      pendingRef.current = null
      applyHookMessages(msgs, setMessages)
    })
    return () => {
      cancelled = true
    }
  }, [setMessages, pendingHookMessages])

  return useCallback(async () => {
    if (resolvedRef.current || !pendingRef.current || gaveUpWaitingRef.current) {
      return
    }

    const waitMs = getDeferredHookWaitMs()
    const promise = pendingRef.current

    if (!Number.isFinite(waitMs)) {
      const msgs = await promise
      if (resolvedRef.current) return
      resolvedRef.current = true
      pendingRef.current = null
      applyHookMessages(msgs, setMessages)
      return
    }

    let finished = false
    const msgs = await Promise.race([
      promise.then(result => {
        finished = true
        return result
      }),
      new Promise<HookResultMessage[]>(resolve => {
        setTimeout(() => resolve([]), waitMs)
      }),
    ])

    if (resolvedRef.current) return

    if (!finished) {
      gaveUpWaitingRef.current = true
      logForDebugging(
        `SessionStart hooks still running after ${waitMs}ms — proceeding without waiting (messages inject when ready)`,
        { level: 'warn' },
      )
      return
    }

    resolvedRef.current = true
    pendingRef.current = null
    applyHookMessages(msgs, setMessages)
  }, [setMessages])
}
