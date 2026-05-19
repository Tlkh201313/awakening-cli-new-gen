import React, { useState } from 'react'
import { Box, Text } from '../ink.js'

interface SurveyPromptProps {
  onSubmit: (rating: number, comment?: string) => void
  onDismiss: () => void
}

export function SurveyPrompt({ onSubmit, onDismiss }: SurveyPromptProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')

  const handleRating = (value: number) => {
    setRating(value)
  }

  const handleSubmit = () => {
    if (rating !== null) {
      onSubmit(rating, comment || undefined)
    }
  }

  if (rating === null) {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor="yellow" padding={1}>
        <Text bold>How's this session going?</Text>
        <Box marginTop={1}>
          <Text>Rate 1-5 (1=poor, 5=excellent): </Text>
          {[1, 2, 3, 4, 5].map(v => (
            <Text key={v} color="cyan" bold> [{v}] </Text>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press 1-5 to rate, or Esc to dismiss</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="green" padding={1}>
      <Text bold>Thanks for rating: {rating}/5</Text>
      <Box marginTop={1}>
        <Text dimColor>Optional comment (Enter to submit, Esc to skip): </Text>
      </Box>
    </Box>
  )
}
