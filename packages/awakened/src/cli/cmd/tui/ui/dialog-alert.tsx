import { useTheme } from "../context/theme"
import { useDialog, type DialogContext } from "./dialog"
import { DialogButton, DialogHeader } from "./dialog-chrome"
import { useBindings } from "../keymap"
import { FadeIn } from "../util/motion"

export type DialogAlertProps = {
  title: string
  message: string
  onConfirm?: () => void
}

export function DialogAlert(props: DialogAlertProps) {
  const dialog = useDialog()
  const { theme } = useTheme()

  useBindings(() => ({
    bindings: [
      {
        key: "return",
        desc: "Confirm alert",
        group: "Dialog",
        cmd: () => {
          props.onConfirm?.()
          dialog.clear()
        },
      },
    ],
  }))

  return (
    <box paddingLeft={1} paddingRight={1} gap={1} paddingBottom={1}>
      <DialogHeader title={props.title} />
      <FadeIn delay={60} duration={200}>
        <box paddingBottom={1}>
          <text fg={theme.textMuted}>{props.message}</text>
        </box>
      </FadeIn>
      <box flexDirection="row" justifyContent="flex-end">
        <DialogButton
          label="ok"
          active
          delay={120}
          onPress={() => {
            props.onConfirm?.()
            dialog.clear()
          }}
        />
      </box>
    </box>
  )
}

DialogAlert.show = (dialog: DialogContext, title: string, message: string) => {
  return new Promise<void>((resolve) => {
    dialog.replace(
      () => <DialogAlert title={title} message={message} onConfirm={() => resolve()} />,
      () => resolve(),
    )
  })
}
