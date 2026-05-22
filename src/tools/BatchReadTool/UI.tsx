import React from 'react'
import { Text } from '../../ink.js'
import { MessageResponse } from '../../components/MessageResponse.js'

export function userFacingName(): string {
  return 'Batch Read'
}

export function renderToolUseMessage({ file_paths }: { file_paths: string[] }): React.ReactNode {
  return (
    <MessageResponse>
      <Text>
        Reading {file_paths.length} file{file_paths.length > 1 ? 's' : ''}...
      </Text>
    </MessageResponse>
  )
}
