import React from 'react';
import Box from './Box.js';
import Text from './Text.js';
import { useErrorShake } from '../../hooks/useErrorShake.js';

type Props = {
  readonly error: Error;
};

export default function ErrorOverview({
  error
}: Props) {
  const { offsetX, flashIntensity, ref: shakeRef } = useErrorShake(true);
  const message = error.message || 'Unknown error';
  const stackLines = error.stack ? error.stack.split('\n').slice(1) : [];
  const errorColor = flashIntensity > 0 ? 'red' : undefined;
  return <Box flexDirection="column" padding={1} ref={shakeRef}>
      <Box>
        <Text backgroundColor="ansi:red" color="ansi:white">
          {' '}
          ERROR{' '}
        </Text>
        <Text color={errorColor}>{' '.repeat(Math.max(0, offsetX))}{message}</Text>
      </Box>

      {stackLines.length > 0 && <Box marginTop={1} flexDirection="column">
          {stackLines.map((line, index) => <Text key={`${index}:${line}`}>{line}</Text>)}
        </Box>}
    </Box>;
}
