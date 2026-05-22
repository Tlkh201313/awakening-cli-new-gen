import * as React from 'react'
import { Box, Text } from '../../ink.js'
import type {
  LocalJSXCommandCall,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import { Select } from '../../components/CustomSelect/index.js'
import { Pane } from '../../components/design-system/Pane.js'
import { KeyboardShortcutHint } from '../../components/design-system/KeyboardShortcutHint.js'
import { Byline } from '../../components/design-system/Byline.js'
import { useKeybinding } from '../../keybindings/useKeybinding.js'
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js'

type Props = {
  onDone: LocalJSXCommandOnDone
}

function ThinkingDisplayCommand({ onDone }: Props): React.ReactElement {
  const exitState = useExitOnCtrlCDWithKeybindings()
  const current = getGlobalConfig().hideThinkingBlocks ?? false

  const options = [
    {
      value: 'show',
      label: 'Show thinking blocks',
      description: 'Display thinking process in output (default)',
    },
    {
      value: 'hide',
      label: 'Hide thinking blocks',
      description: 'Hide thinking display (still processes thinking)',
    },
  ]

  const handleSelect = React.useCallback(
    (value: string) => {
      const hide = value === 'hide'
      saveGlobalConfig((c) => ({ ...c, hideThinkingBlocks: hide }))
      onDone(
        hide
          ? 'Thinking blocks hidden. Model still thinks, but output is hidden.'
          : 'Thinking blocks visible. Thinking process will be displayed.',
      )
    },
    [onDone],
  )

  const handleCancel = React.useCallback(() => {
    onDone('Thinking display settings unchanged', { display: 'system' })
  }, [onDone])

  useKeybinding('confirm:no', handleCancel, { context: 'Confirmation' })

  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Box marginBottom={1} flexDirection="column">
          <Text color="remember" bold={true}>
            Toggle thinking display
          </Text>
          <Text dimColor={true}>
            Control whether thinking blocks are shown in output.
          </Text>
          <Text dimColor={true}>
            Note: Model still processes thinking when hidden.
          </Text>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Select
            defaultValue={current ? 'hide' : 'show'}
            defaultFocusValue={current ? 'hide' : 'show'}
            options={options}
            onChange={handleSelect}
            onCancel={handleCancel}
            visibleOptionCount={2}
          />
        </Box>

        <Text dimColor={true} italic={true}>
          {exitState.pending ? (
            <>Press {exitState.keyName} again to exit</>
          ) : (
            <Byline>
              <KeyboardShortcutHint shortcut="Enter" action="confirm" />
              <KeyboardShortcutHint shortcut="Esc" action="exit" />
            </Byline>
          )}
        </Text>
      </Box>
    </Pane>
  )
}

export const call: LocalJSXCommandCall = async (onDone, _context) => {
  return <ThinkingDisplayCommand onDone={onDone} />
}
