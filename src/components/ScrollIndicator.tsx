import React, { useCallback, useRef, useSyncExternalStore } from 'react'
import type { ScrollBoxHandle } from '../ink/components/ScrollBox.js'
import { Box, Text } from '../ink.js'
import { useAnimationFrame } from '../ink/hooks/use-animation-frame.js'
import { useSettings } from '../hooks/useSettings.js'

const FADE_IN_MS = 200
const FADE_OUT_MS = 150

type ScrollIndicatorState = {
  isAtBottom: boolean
  messagesAbove: number
}

/**
 * Hook that tracks scroll position and computes the scroll indicator state.
 * Uses useSyncExternalStore to subscribe to ScrollBox changes without
 * causing re-renders in the parent (REPL).
 */
export function useScrollIndicator(
  scrollRef: React.RefObject<ScrollBoxHandle | null> | undefined,
  totalMessageCount: number,
): ScrollIndicatorState {
  // Track the message count when the user first scrolled away from bottom.
  // Used to compute how many messages are "above" the viewport.
  const messageCountAtScrollRef = useRef(0)

  const subscribe = useCallback(
    (listener: () => void) =>
      scrollRef?.current?.subscribe(listener) ?? (() => {}),
    [scrollRef],
  )

  const getSnapshot = useCallback((): ScrollIndicatorState => {
    const s = scrollRef?.current
    if (!s) return { isAtBottom: true, messagesAbove: 0 }

    const isSticky = s.isSticky()
    if (isSticky) {
      // At bottom — reset baseline
      messageCountAtScrollRef.current = totalMessageCount
      return { isAtBottom: true, messagesAbove: 0 }
    }

    // Scrolled away from bottom
    // Capture the message count at the moment we first scrolled away
    if (messageCountAtScrollRef.current === 0) {
      messageCountAtScrollRef.current = totalMessageCount
    }

    // Messages that arrived while scrolled up
    const newMessages = totalMessageCount - messageCountAtScrollRef.current
    // Estimate messages above viewport based on scroll position
    const scrollTop = s.getScrollTop() + (s.getPendingDelta() ?? 0)
    const scrollHeight = s.getScrollHeight()
    const viewportHeight = s.getViewportHeight()

    // Use scroll fraction to estimate how many messages are above
    // If fully scrolled to top, all messages are above
    // If just barely scrolled up, ~0 messages are above
    const maxScroll = Math.max(0, scrollHeight - viewportHeight)
    const scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0
    const estimatedAbove = Math.max(
      Math.round(totalMessageCount * (1 - scrollFraction)),
      0,
    )

    // Combine: at least show new messages that arrived, or estimated above
    const messagesAbove = Math.max(estimatedAbove, newMessages)

    return { isAtBottom: false, messagesAbove }
  }, [scrollRef, totalMessageCount])

  // Server snapshot for SSR (not used in terminal, but required by API)
  const getServerSnapshot = useCallback(
    (): ScrollIndicatorState => ({ isAtBottom: true, messagesAbove: 0 }),
    [],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

type Props = {
  messageCount: number
  isAtBottom: boolean
}

/**
 * Scroll position indicator that shows "N messages above" when the user
 * is scrolled up from the bottom of the message list.
 *
 * Animations:
 * - Fade in: 200ms (dimColor while fading, then normal)
 * - Fade out: 150ms (dimColor while fading, then hidden)
 * - Reduced motion: instant show/hide
 */
export function ScrollIndicator({ messageCount, isAtBottom }: Props) {
  const settings = useSettings()
  const [ref, time] = useAnimationFrame(16)
  const becameVisibleRef = useRef<number | null>(null)
  const becameHiddenRef = useRef<number | null>(null)

  // Track transitions
  if (!isAtBottom && becameVisibleRef.current === null) {
    becameVisibleRef.current = time
    becameHiddenRef.current = null
  }
  if (isAtBottom && becameHiddenRef.current === null) {
    becameHiddenRef.current = time
    becameVisibleRef.current = null
  }

  // Reduced motion: instant show/hide
  if (settings.prefersReducedMotion) {
    if (isAtBottom) return null
    return (
      <Box>
        <Text dimColor>
          {messageCount} {messageCount === 1 ? 'message' : 'messages'} above
        </Text>
      </Box>
    )
  }

  // Fade in
  if (!isAtBottom && becameVisibleRef.current !== null) {
    const elapsed = time - becameVisibleRef.current
    if (elapsed < FADE_IN_MS) {
      return (
        <Box ref={ref}>
          <Text dimColor>
            {messageCount} {messageCount === 1 ? 'message' : 'messages'} above
          </Text>
        </Box>
      )
    }
    return (
      <Box>
        <Text>
          {messageCount} {messageCount === 1 ? 'message' : 'messages'} above
        </Text>
      </Box>
    )
  }

  // Fade out
  if (isAtBottom && becameHiddenRef.current !== null) {
    const elapsed = time - becameHiddenRef.current
    if (elapsed < FADE_OUT_MS) {
      return (
        <Box ref={ref}>
          <Text dimColor>
            {messageCount} {messageCount === 1 ? 'message' : 'messages'} above
          </Text>
        </Box>
      )
    }
  }

  return null
}
