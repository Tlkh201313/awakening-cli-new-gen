import { describe, expect, test } from 'bun:test'

/**
 * Mirrors REPL getFocusedInputDialog priority: permission prompts must win
 * over promptTypingSuppression (draft text in input).
 */
function pickFocusedDialog(options: {
  promptTypingSuppressionActive: boolean
  toolUseConfirmQueueLen: number
  toolJSXBlocks: boolean
}): 'tool-permission' | undefined {
  const allowDialogsWithAnimation = !options.toolJSXBlocks
  if (allowDialogsWithAnimation && options.toolUseConfirmQueueLen > 0) {
    return 'tool-permission'
  }
  if (options.promptTypingSuppressionActive) return undefined
  return undefined
}

describe('focused dialog priority', () => {
  test('tool permission wins over typing suppression', () => {
    expect(
      pickFocusedDialog({
        promptTypingSuppressionActive: true,
        toolUseConfirmQueueLen: 1,
        toolJSXBlocks: false,
      }),
    ).toBe('tool-permission')
  })

  test('suppression hides when no permission queue', () => {
    expect(
      pickFocusedDialog({
        promptTypingSuppressionActive: true,
        toolUseConfirmQueueLen: 0,
        toolJSXBlocks: false,
      }),
    ).toBe(undefined)
  })
})
