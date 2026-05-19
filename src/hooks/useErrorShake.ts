import { useRef } from 'react'
import { useAnimationFrame } from '../ink/hooks/use-animation-frame.js'
import { useSettings } from './useSettings.js'

const SHAKE_DURATION_MS = 300
const FLASH_DURATION_MS = 200
const TOTAL_DURATION_MS = SHAKE_DURATION_MS + FLASH_DURATION_MS

type ErrorShakeResult = {
  offsetX: number
  flashIntensity: number
  ref: (element: any) => void
}

export function useErrorShake(hasError: boolean): ErrorShakeResult {
  const settings = useSettings()
  const [ref, time] = useAnimationFrame(16)
  const errorTimeRef = useRef<number | null>(null)
  const prevErrorRef = useRef(false)

  // Detect error transition
  if (hasError && !prevErrorRef.current) {
    errorTimeRef.current = time
  }
  if (!hasError) {
    errorTimeRef.current = null
  }
  prevErrorRef.current = hasError

  if (!hasError || errorTimeRef.current === null) {
    return { offsetX: 0, flashIntensity: 0, ref }
  }

  const elapsed = time - errorTimeRef.current

  if (elapsed >= TOTAL_DURATION_MS) {
    errorTimeRef.current = null
    return { offsetX: 0, flashIntensity: 0, ref }
  }

  if (settings.prefersReducedMotion) {
    const flash = elapsed < FLASH_DURATION_MS
      ? Math.sin((elapsed / FLASH_DURATION_MS) * Math.PI)
      : 0
    return { offsetX: 0, flashIntensity: flash, ref }
  }

  let offsetX = 0
  let flashIntensity = 0

  if (elapsed < SHAKE_DURATION_MS) {
    const decay = 1 - elapsed / SHAKE_DURATION_MS
    offsetX = Math.round(Math.sin(elapsed * 0.06) * 2 * decay)
  } else {
    const flashElapsed = elapsed - SHAKE_DURATION_MS
    flashIntensity = Math.sin((flashElapsed / FLASH_DURATION_MS) * Math.PI)
  }

  return { offsetX, flashIntensity, ref }
}
