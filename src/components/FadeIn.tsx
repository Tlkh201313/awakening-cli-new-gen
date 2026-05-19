import React, { useRef } from 'react'
import { Box, Text } from '../ink.js'
import { useAnimationFrame } from '../ink/hooks/use-animation-frame.js'
import { useSettings } from '../hooks/useSettings.js'

type Props = {
  duration: number
  children: React.ReactNode
}

export function FadeIn({ duration, children }: Props) {
  const settings = useSettings()
  const mountTime = useRef<number | null>(null)
  const [ref, time] = useAnimationFrame(16)

  if (settings.prefersReducedMotion) {
    return <>{children}</>
  }

  if (mountTime.current === null) {
    mountTime.current = time
  }

  const elapsed = time - mountTime.current
  const progress = Math.min(elapsed / duration, 1)

  // At progress >= 1, render normally (no dim). While animating, use dimColor.
  if (progress >= 1) {
    return <Box ref={ref}>{children}</Box>
  }

  return (
    <Box ref={ref}>
      <Text dimColor>{children}</Text>
    </Box>
  )
}
