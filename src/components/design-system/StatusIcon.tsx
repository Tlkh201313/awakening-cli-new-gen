import figures from 'figures';
import React, { useRef } from 'react';
import { Text } from '../../ink.js';
import { useAnimationFrame } from '../../ink/hooks/use-animation-frame.js';
import { interpolateColor, toRGBColor } from '../Spinner/utils.js';
import { useSettings } from '../../hooks/useSettings.js';
type Status = 'success' | 'error' | 'warning' | 'info' | 'pending' | 'loading';
type Props = {
  /**
   * The status to display. Determines both the icon and color.
   *
   * - `success`: Green checkmark (✓) with brightness pulse on transition
   * - `error`: Red cross (✗)
   * - `warning`: Yellow warning symbol (⚠)
   * - `info`: Blue info symbol (ℹ)
   * - `pending`: Dimmed circle (○)
   * - `loading`: Dimmed ellipsis (…)
   */
  status: Status;
  /**
   * Include a trailing space after the icon. Useful when followed by text.
   * @default false
   */
  withSpace?: boolean;
};
const PULSE_DURATION_MS = 400;
const GREEN_BRIGHT = { r: 80, g: 220, b: 100 };
const GREEN_DIM = { r: 40, g: 140, b: 60 };
const STATUS_CONFIG: Record<Status, {
  icon: string;
  color: 'success' | 'error' | 'warning' | 'suggestion' | undefined;
}> = {
  success: {
    icon: figures.tick,
    color: 'success'
  },
  error: {
    icon: figures.cross,
    color: 'error'
  },
  warning: {
    icon: figures.warning,
    color: 'warning'
  },
  info: {
    icon: figures.info,
    color: 'suggestion'
  },
  pending: {
    icon: figures.circle,
    color: undefined
  },
  loading: {
    icon: '…',
    color: undefined
  }
};

/**
 * Renders a status indicator icon with appropriate color.
 *
 * On transition to 'success', plays a green brightness pulse
 * (bright -> dim -> bright) over 400ms before settling on static green.
 *
 * @example
 * // Success indicator
 * <StatusIcon status="success" />
 *
 * @example
 * // Error with trailing space for text
 * <Text><StatusIcon status="error" withSpace />Failed to connect</Text>
 *
 * @example
 * // Status line pattern
 * <Text>
 *   <StatusIcon status="pending" withSpace />
 *   Waiting for response
 * </Text>
 */
export function StatusIcon({
  status,
  withSpace = false
}: Props) {
  const settings = useSettings();
  const [ref, time] = useAnimationFrame(16);
  const successTimeRef = useRef<number | null>(null);
  const prevStatusRef = useRef<Status>(status);

  const config = STATUS_CONFIG[status];

  // Detect transition to 'success' — start the pulse timer
  if (status === 'success' && prevStatusRef.current !== 'success') {
    successTimeRef.current = time;
  }
  if (status !== 'success') {
    successTimeRef.current = null;
  }
  prevStatusRef.current = status;

  // Compute interpolated pulse color during the animation window
  let pulseColor: string | undefined;
  if (status === 'success' && successTimeRef.current !== null) {
    const elapsed = time - successTimeRef.current;
    if (elapsed < PULSE_DURATION_MS && !settings.prefersReducedMotion) {
      // Bright -> dim -> bright: sine wave from 0..1..0
      const t = Math.sin((elapsed / PULSE_DURATION_MS) * Math.PI);
      const color = interpolateColor(GREEN_BRIGHT, GREEN_DIM, t);
      pulseColor = toRGBColor(color);
    }
  }

  const dimColor = !config.color;
  const space = withSpace ? ' ' : undefined;

  return (
    <Text color={pulseColor ?? config.color} dimColor={dimColor}>
      {config.icon}{space}
    </Text>
  );
}
