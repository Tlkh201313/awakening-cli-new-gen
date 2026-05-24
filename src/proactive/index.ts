/**
 * Open-build stub for autonomous / Kairos proactive mode.
 * Full implementation is not mirrored in this fork; build.ts keeps PROACTIVE/KAIROS off.
 */

type ProactiveListener = () => void

const listeners = new Set<ProactiveListener>()

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

export function isProactiveActive(): boolean {
  return false
}

export function isProactivePaused(): boolean {
  return false
}

export function activateProactive(_source: string): void {
  // no-op in open build
}

export function pauseProactive(): void {
  // no-op
}

export function resumeProactive(): void {
  // no-op
}

export function setContextBlocked(_blocked: boolean): void {
  // no-op
}

export function getNextTickAt(): null {
  return null
}

export function subscribeToProactiveChanges(listener: ProactiveListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
