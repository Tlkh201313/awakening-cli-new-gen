import { useEffect, useState } from 'react';
import { Text } from '../../ink.js';

interface AnimatedShineTextProps {
  children: string;
  speed?: number;
}

/**
 * Text with a cycling shine/sparkle effect.
 * A bright highlight sweeps across the characters, creating a shining animation.
 */
export function AnimatedShineText({ children, speed = 150 }: AnimatedShineTextProps) {
  const [position, setPosition] = useState(0);
  const text = children;
  const len = text.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setPosition(prev => (prev + 1) % (len + 4));
    }, speed);
    return () => clearInterval(timer);
  }, [len, speed]);

  const chars = text.split('');
  const shineWidth = 3;

  return (
    <Text>
      {chars.map((char, i) => {
        const dist = Math.abs(i - position);
        const isShining = dist < shineWidth;

        if (isShining) {
          const intensity = 1 - dist / shineWidth;
          if (intensity > 0.6) {
            return (
              <Text key={i} bold color="white">
                {char}
              </Text>
            );
          }
          return (
            <Text key={i} bold color="gray">
              {char}
            </Text>
          );
        }
        return (
          <Text key={i} bold>
            {char}
          </Text>
        );
      })}
    </Text>
  );
}
