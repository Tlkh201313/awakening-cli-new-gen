import * as React from 'react'
import type { LocalJSXCommandOnDone } from '../../types/command.js'
import type { LocalJSXCommandContext } from '../../commands.js'
import { transitionPermissionMode } from '../../utils/permissions/permissionSetup.js'

export async function call(
  onDone: LocalJSXCommandOnDone,
  context: LocalJSXCommandContext,
  args?: string,
): Promise<React.ReactNode | null> {
  const arg = args?.trim().toLowerCase()
  const appState = context.getAppState()
  const currentMode = appState.toolPermissionContext.mode

  if (arg === 'on') {
    if (currentMode === 'pilot') {
      onDone('Pilot mode is already active')
      return null
    }
    const newContext = transitionPermissionMode(
      currentMode,
      'pilot',
      appState.toolPermissionContext,
    )
    context.setAppState(prev => ({
      ...prev,
      toolPermissionContext: {
        ...newContext,
        mode: 'pilot',
      },
    }))
    onDone('Pilot mode ON — all permissions auto-approved except removal commands (rm, rmdir)')
    return null
  }

  if (arg === 'off') {
    if (currentMode !== 'pilot') {
      onDone('Pilot mode is not active')
      return null
    }
    const newContext = transitionPermissionMode(
      currentMode,
      'default',
      appState.toolPermissionContext,
    )
    context.setAppState(prev => ({
      ...prev,
      toolPermissionContext: {
        ...newContext,
        mode: 'default',
      },
    }))
    onDone('Pilot mode OFF — returned to default permission mode')
    return null
  }

  // Toggle
  if (currentMode === 'pilot') {
    const newContext = transitionPermissionMode(
      currentMode,
      'default',
      appState.toolPermissionContext,
    )
    context.setAppState(prev => ({
      ...prev,
      toolPermissionContext: {
        ...newContext,
        mode: 'default',
      },
    }))
    onDone('Pilot mode OFF — returned to default permission mode')
  } else {
    const newContext = transitionPermissionMode(
      currentMode,
      'pilot',
      appState.toolPermissionContext,
    )
    context.setAppState(prev => ({
      ...prev,
      toolPermissionContext: {
        ...newContext,
        mode: 'pilot',
      },
    }))
    onDone('Pilot mode ON — all permissions auto-approved except removal commands (rm, rmdir)')
  }

  return null
}
