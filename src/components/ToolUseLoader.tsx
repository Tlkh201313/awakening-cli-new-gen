import React, { useRef } from 'react';
import { BLACK_CIRCLE } from '../constants/figures.js';
import { useBlink } from '../hooks/useBlink.js';
import { useAnimationFrame } from '../ink/hooks/use-animation-frame.js';
import { interpolateColor, toRGBColor } from './Spinner/utils.js';
import { useSettings } from '../hooks/useSettings.js';
import { Box, Text } from '../ink.js';

type Props = {
  isError: boolean;
  isUnresolved: boolean;
  shouldAnimate: boolean;
};

const COMPLETION_DURATION_MS = 500;
const FLASH_DURATION_MS = 200;
const GREEN_BRIGHT = { r: 80, g: 220, b: 100 };
const GREEN_DIM = { r: 40, g: 140, b: 60 };
const CHECKMARK = '\u2713';

export function ToolUseLoader({ isError, isUnresolved, shouldAnimate }: Props) {
  const settings = useSettings();
  const reducedMotion = settings.prefersReducedMotion ?? false;
  const [ref, isBlinking] = useBlink(shouldAnimate);
  const completionTimeRef = useRef<number | null>(null);
  const wasUnresolvedRef = useRef(isUnresolved);
  const [, time] = useAnimationFrame(reducedMotion ? null : 16);

  // Detect transition: unresolved -> resolved (not error)
  if (wasUnresolvedRef.current && !isUnresolved && !isError) {
    completionTimeRef.current = time;
  }
  wasUnresolvedRef.current = isUnresolved;

  // Check if we're still in the completion animation window
  const isAnimating =
    completionTimeRef.current !== null &&
    time - completionTimeRef.current < COMPLETION_DURATION_MS;

  // Clear completion ref when animation ends
  if (completionTimeRef.current !== null && !isAnimating) {
    completionTimeRef.current = null;
  }

  // Render completion animation (green flash + checkmark)
  if (isAnimating && !reducedMotion) {
    const elapsed = time - completionTimeRef.current!;
    const showCheckmark = elapsed >= FLASH_DURATION_MS;

    if (showCheckmark) {
      return (
        <Box ref={ref} minWidth={2}>
          <Text color={toRGBColor(GREEN_BRIGHT)}>{CHECKMARK}</Text>
        </Box>
      );
    }

    // Phase 1: flash green (interpolate from dim to bright)
    const flashProgress = elapsed / FLASH_DURATION_MS;
    const flashColor = interpolateColor(GREEN_DIM, GREEN_BRIGHT, flashProgress);
    return (
      <Box ref={ref} minWidth={2}>
        <Text color={toRGBColor(flashColor)}>{BLACK_CIRCLE}</Text>
      </Box>
    );
  }

  // Reduced motion: instant checkmark on completion
  if (
    completionTimeRef.current !== null &&
    reducedMotion &&
    !isUnresolved &&
    !isError
  ) {
    completionTimeRef.current = null;
    return (
      <Box ref={ref} minWidth={2}>
        <Text color="success">{CHECKMARK}</Text>
      </Box>
    );
  }

  // Original behavior for non-completion states
  const color = isUnresolved ? undefined : isError ? 'error' : 'success';
  const character =
    !shouldAnimate || isBlinking || isError || !isUnresolved
      ? BLACK_CIRCLE
      : ' ';

  return (
    <Box ref={ref} minWidth={2}>
      <Text color={color} dimColor={isUnresolved}>
        {character}
      </Text>
    </Box>
  );
}
