import { createSignal, onCleanup, onMount, type Accessor } from "solid-js"

export const BANNER_SHINE_MS = 1500
export const BANNER_SHINE_PEAK = 0.18
export const BANNER_ROW_STAGGER_MS = 55
export const BANNER_ROW_FADE_MS = 220

export function bannerShineBoost(
  char: string,
  col: number,
  row: number,
  phase: number,
  intensity = BANNER_SHINE_PEAK,
) {
  if (char === " ") return 0
  const pos = col * 0.35 + row * 1.6
  const wave = Math.sin((pos - phase) * 0.52) * 0.5 + 0.5
  return wave * wave * intensity
}

export function useBannerShine(enabled: Accessor<boolean>) {
  const [shining, setShining] = createSignal(false)
  const [phase, setPhase] = createSignal(0)

  onMount(() => {
    if (!enabled()) return

    setShining(true)
    const start = performance.now()
    const timer = setInterval(() => {
      const elapsed = performance.now() - start
      if (elapsed >= BANNER_SHINE_MS) {
        setShining(false)
        clearInterval(timer)
        return
      }
      setPhase((elapsed / BANNER_SHINE_MS) * 6.5)
    }, 32)

    onCleanup(() => clearInterval(timer))
  })

  return { shining, phase }
}
