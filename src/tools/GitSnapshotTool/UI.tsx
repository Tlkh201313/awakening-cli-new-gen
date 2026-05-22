import React from 'react'
import { Text } from '../../ink.js'
import { MessageResponse } from '../../components/MessageResponse.js'

export function userFacingName(): string {
  return 'Git Snapshot'
}

export function renderToolUseMessage(): React.ReactNode {
  return (
    <MessageResponse>
      <Text>Getting git repository snapshot...</Text>
    </MessageResponse>
  )
}
