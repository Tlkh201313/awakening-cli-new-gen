/**
 * Recover Ink + stream UI when the terminal tab regains focus.
 * Never call forceRedraw() while a permission/modal dialog is open — that
 * clears the screen and leaves the Select prompt visible but unresponsive.
 */
import { type RefObject, useCallback, useEffect, useRef } from 'react'
import instances from '../ink/instances.js'
import { useStdin, useTerminalFocus } from '../ink.js'
import { recoverClientUiAfterTerminalFocus } from '../utils/awakenedMemory.js'
import { flushStreamUiThrottleState } from '../utils/streamUiThrottle.js'

export type BlockingInputDialog =
  | 'message-selector'
  | 'sandbox-permission'
  | 'tool-permission'
  | 'prompt'
  | 'worker-sandbox-permission'
  | 'elicitation'
  | 'cost'
  | 'idle-return'
  | 'voice-setup'
  | 'init-onboarding'
  | 'ide-onboarding'
  | 'model-switch'
  | 'undercover-callout'
  | 'effort-callout'
  | 'remote-callout'
  | 'lsp-recommendation'
  | 'plugin-hint'
  | 'desktop-upsell'
  | 'ultraplan-choice'
  | 'ultraplan-launch'
  | undefined

function recoverTerminalUi(_blockingDialog: BlockingInputDialog): void {
  recoverClientUiAfterTerminalFocus()
  flushStreamUiThrottleState()
  // Never forceRedraw on tab focus — ERASE_SCREEN duplicates the prompt row
  // on Windows Terminal. softRecover repaints without clearing the screen.
  instances.get(process.stdout)?.softRecoverTerminal()
}

export function useTerminalFocusRecovery(
  focusedInputDialogRef: RefObject<BlockingInputDialog>,
): void {
  const focused = useTerminalFocus()
  const wasFocusedRef = useRef(focused)
  const recoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { internal_eventEmitter } = useStdin()

  const scheduleRecover = useCallback((): void => {
    if (recoverTimerRef.current) clearTimeout(recoverTimerRef.current)
    recoverTimerRef.current = setTimeout(() => {
      recoverTimerRef.current = null
      recoverTerminalUi(focusedInputDialogRef.current)
    }, 50)
  }, [focusedInputDialogRef])

  useEffect(() => {
    const onFocus = (): void => {
      scheduleRecover()
    }
    internal_eventEmitter?.on('terminalfocus', onFocus)
    return () => {
      internal_eventEmitter?.off('terminalfocus', onFocus)
      if (recoverTimerRef.current) clearTimeout(recoverTimerRef.current)
    }
  }, [internal_eventEmitter, scheduleRecover])

  useEffect(() => {
    const wasFocused = wasFocusedRef.current
    if (focused && !wasFocused) {
      scheduleRecover()
    } else if (!focused && wasFocused) {
      flushStreamUiThrottleState()
    }
    wasFocusedRef.current = focused
  }, [focused, scheduleRecover])
}
