import { useTheme } from "@tui/context/theme"
import { useDialog } from "./dialog"
import { DialogButton, DialogHeader } from "./dialog-chrome"
import { useBindings, useCommandShortcut } from "../keymap"
import { FadeIn } from "../util/motion"

export function DialogHelp() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const commandShortcut = useCommandShortcut("command.palette.show")

  useBindings(() => ({
    bindings: [
      { key: "return", desc: "Close help", group: "Dialog", cmd: () => dialog.clear() },
      { key: "escape", desc: "Close help", group: "Dialog", cmd: () => dialog.clear() },
    ],
  }))

  return (
    <box paddingLeft={1} paddingRight={1} gap={1} paddingBottom={1}>
      <DialogHeader title="Help" hint="esc/enter" />
      <FadeIn delay={60} duration={200}>
        <box gap={1} paddingBottom={1}>
          <text fg={theme.text}>
            Press {commandShortcut()} to open the command palette.
          </text>

          <text fg={theme.accent}>Slash Commands</text>
          <box paddingLeft={1}>
            <text fg={theme.textMuted}>/new ............ Start a new session</text>
            <text fg={theme.textMuted}>/sessions ....... List and resume sessions</text>
            <text fg={theme.textMuted}>/models ......... Switch AI model</text>
            <text fg={theme.textMuted}>/agents ......... Switch agent (build/plan)</text>
            <text fg={theme.textMuted}>/compact ........ Summarize long sessions</text>
            <text fg={theme.textMuted}>/connect ........ Connect a provider</text>
            <text fg={theme.textMuted}>/status ......... View system status</text>
            <text fg={theme.textMuted}>/awakened ....... View capabilities</text>
            <text fg={theme.textMuted}>/themes ......... Switch theme</text>
            <text fg={theme.textMuted}>/help ........... This dialog</text>
          </box>

          <text fg={theme.accent}>Keyboard Shortcuts</text>
          <box paddingLeft={1}>
            <text fg={theme.textMuted}>Ctrl+K ......... Command palette</text>
            <text fg={theme.textMuted}>Ctrl+L ......... Clear screen</text>
            <text fg={theme.textMuted}>Ctrl+C ......... Cancel / interrupt</text>
            <text fg={theme.textMuted}>Escape ......... Close dialog / go back</text>
            <text fg={theme.textMuted}>Tab ............ Autocomplete</text>
            <text fg={theme.textMuted}>Up/Down ........ Browse history</text>
          </box>

          <text fg={theme.accent}>Quick Start</text>
          <box paddingLeft={1}>
            <text fg={theme.textMuted}>1. Connect a provider with /connect</text>
            <text fg={theme.textMuted}>2. Pick a model with /models</text>
            <text fg={theme.textMuted}>3. Start typing to chat with AI</text>
            <text fg={theme.textMuted}>4. Use @files to reference code</text>
            <text fg={theme.textMuted}>5. AI will use tools automatically</text>
          </box>
        </box>
      </FadeIn>
      <box flexDirection="row" justifyContent="flex-end">
        <DialogButton label="ok" active onPress={() => dialog.clear()} />
      </box>
    </box>
  )
}
