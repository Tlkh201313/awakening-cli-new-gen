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
        <box paddingBottom={1}>
          <text fg={theme.textMuted}>
            Press {commandShortcut()} to see all available actions and commands in any context.
          </text>
        </box>
      </FadeIn>
      <box flexDirection="row" justifyContent="flex-end">
        <DialogButton label="ok" active onPress={() => dialog.clear()} />
      </box>
    </box>
  )
}
