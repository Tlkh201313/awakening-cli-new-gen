import { createEffect, createSignal, on, onCleanup, onMount, type Accessor } from "solid-js"
import { debounce, type Scheduled } from "@solid-primitives/scheduled"

export function easeSmoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

export function createDebouncedSignal<T>(value: T, ms: number): [Accessor<T>, Scheduled<[value: T]>] {
  const [get, set] = createSignal(value)
  return [get, debounce((v: T) => set(() => v), ms)]
}

export function createFadeIn(show: Accessor<boolean>, enabled: Accessor<boolean>, durationMs = 160) {
  const [alpha, setAlpha] = createSignal(show() ? 1 : 0)
  let revealed = show()

  createEffect(
    on([show, enabled], ([visible, animate]) => {
      if (!visible) {
        setAlpha(0)
        revealed = false
        return
      }

      if (!animate || revealed) {
        revealed = true
        setAlpha(1)
        return
      }

      const start = performance.now()
      revealed = true
      setAlpha(0)

      const timer = setInterval(() => {
        const progress = Math.min((performance.now() - start) / durationMs, 1)
        setAlpha(easeSmoothstep(progress))
        if (progress >= 1) clearInterval(timer)
      }, 16)

      onCleanup(() => clearInterval(timer))
    }),
  )

  return alpha
}

export function createDelayedFadeIn(
  show: Accessor<boolean>,
  enabled: Accessor<boolean>,
  delayMs: number,
  durationMs = 180,
) {
  const [delayed, setDelayed] = createSignal(!enabled() || delayMs === 0)

  createEffect(
    on(show, (visible) => {
      if (!visible) {
        setDelayed(false)
        return
      }

      if (!enabled()) {
        setDelayed(true)
        return
      }

      setDelayed(false)
      const timer = setTimeout(() => setDelayed(true), delayMs)
      onCleanup(() => clearTimeout(timer))
    }),
  )

  return createFadeIn(() => show() && delayed(), enabled, durationMs)
}

export function createDialogEnter(enabled: Accessor<boolean>) {
  const [open, setOpen] = createSignal(!enabled())

  onMount(() => {
    if (enabled()) setOpen(true)
  })

  const overlay = createFadeIn(open, enabled, 220)
  const panel = createDelayedFadeIn(open, enabled, 40, 280)

  return {
    overlay,
    panel,
    slide: () => Math.round((1 - panel()) * 2.5),
  }
}

export function createFadeTransition(visible: Accessor<boolean>, enabled: Accessor<boolean>, durationMs = 200) {
  const [alpha, setAlpha] = createSignal(visible() ? 1 : 0)

  createEffect(
    on([visible, enabled], ([show, animate]) => {
      if (!animate) {
        setAlpha(show ? 1 : 0)
        return
      }

      const from = alpha()
      const to = show ? 1 : 0
      if (from === to) return

      const start = performance.now()
      const timer = setInterval(() => {
        const progress = Math.min((performance.now() - start) / durationMs, 1)
        setAlpha(from + (to - from) * easeSmoothstep(progress))
        if (progress >= 1) clearInterval(timer)
      }, 16)

      onCleanup(() => clearInterval(timer))
    }),
  )

  return alpha
}

export function createPulse(active: Accessor<boolean>, enabled: Accessor<boolean>, periodMs = 900) {
  const [value, setValue] = createSignal(1)

  createEffect(
    on([active, enabled], ([on, animate]) => {
      if (!on || !animate) {
        setValue(1)
        return
      }

      const start = performance.now()
      const timer = setInterval(() => {
        const phase = ((performance.now() - start) % periodMs) / periodMs
        setValue(0.55 + 0.45 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2)))
      }, 32)

      onCleanup(() => clearInterval(timer))
    }),
  )

  return value
}
