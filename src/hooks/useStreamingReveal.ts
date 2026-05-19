import { useRef } from 'react'
import { useAnimationFrame } from '../ink/hooks/use-animation-frame.js'
import { getGraphemeSegmenter } from '../utils/intl.js'
import { useSettings } from './useSettings.js'

const CHAR_REVEAL_MS = 20
const CURSOR_HIDE_DELAY_MS = 500
const CURSOR = '\u258c' // ▌

type StreamingRevealResult = {
  displayText: string
  showCursor: boolean
  ref: (element: any) => void
}

export function useStreamingReveal(
  text: string,
  isStreaming: boolean,
): StreamingRevealResult {
  const settings = useSettings()
  const [ref, time] = useAnimationFrame(16)
  const startTimeRef = useRef<number | null>(null)
  const streamEndRef = useRef<number>(0)
  const prevStreamingRef = useRef(isStreaming)

  // Reset on new streaming session
  if (isStreaming && !prevStreamingRef.current) {
    startTimeRef.current = time
    streamEndRef.current = 0
  }
  prevStreamingRef.current = isStreaming

  // Track stream end
  if (!isStreaming && streamEndRef.current === 0 && startTimeRef.current !== null) {
    streamEndRef.current = time
  }

  if (settings.prefersReducedMotion || !isStreaming) {
    return { displayText: text, showCursor: false, ref }
  }

  if (startTimeRef.current === null) {
    startTimeRef.current = time
  }

  // Segment into graphemes
  const segmenter = getGraphemeSegmenter()
  const graphemes = [...segmenter.segment(text)]
  const totalGraphemes = graphemes.length

  // Advance reveal index based on elapsed time
  const elapsed = time - startTimeRef.current
  const targetIndex = Math.min(Math.floor(elapsed / CHAR_REVEAL_MS), totalGraphemes)

  // Build display text from graphemes
  let displayText = ''
  for (let i = 0; i < targetIndex && i < totalGraphemes; i++) {
    displayText += graphemes[i]!.segment
  }

  // Show cursor while streaming or briefly after
  const showCursor =
    isStreaming ||
    (streamEndRef.current > 0 && time - streamEndRef.current < CURSOR_HIDE_DELAY_MS)

  return {
    displayText: displayText + (showCursor ? CURSOR : ''),
    showCursor,
    ref,
  }
}
