import * as React from 'react'
import type { LocalJSXCommandOnDone } from '../../types/command.js'
import type { LocalJSXCommandContext } from '../../commands.js'

export async function call(
  onDone: LocalJSXCommandOnDone,
  context: LocalJSXCommandContext,
  args?: string,
): Promise<React.ReactNode | null> {
  const arg = args?.trim().toLowerCase()

  if (arg === 'on' || arg === 'off') {
    const enableThinking = arg === 'on'
    context.setAppState(prev => ({
      ...prev,
      verbose: enableThinking,
      thinkingEnabled: enableThinking,
    }))
    onDone(
      enableThinking
        ? 'Thinking ON — model reasoning enabled and will be shown'
        : 'Thinking OFF — model reasoning disabled and hidden',
    )
    return null
  }

  // Toggle current state
  const appState = context.getAppState()
  const currentEnabled = appState.thinkingEnabled !== false
  const newState = !currentEnabled
  context.setAppState(prev => ({
    ...prev,
    verbose: newState,
    thinkingEnabled: newState,
  }))
  onDone(
    newState
      ? 'Thinking ON — model reasoning enabled and will be shown'
      : 'Thinking OFF — model reasoning disabled and hidden',
  )
  return null
}
