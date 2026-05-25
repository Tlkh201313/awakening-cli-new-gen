import { TextAttributes } from "@opentui/core"
import { useTheme, tint } from "@tui/context/theme"
import { useDialog } from "./dialog"
import { FadeIn } from "../util/motion"
import { fadeColor } from "../util/color"
import { useKV } from "../context/kv"
import { createPulse } from "../util/signal"

export function DialogHeader(props: { title: string; hint?: string; onClose?: () => void }) {
  const { theme } = useTheme()
  const dialog = useDialog()

  const close = () => {
    if (props.onClose) props.onClose()
    else dialog.clear()
  }

  return (
    <FadeIn delay={20} duration={200}>
      <box gap={1}>
        <box flexDirection="row" alignItems="center" gap={1}>
          <text fg={theme.primary}>◆</text>
          <text attributes={TextAttributes.BOLD} fg={theme.text} flexGrow={1}>
            {props.title}
          </text>
          <text fg={theme.textMuted} onMouseUp={close}>
            {props.hint ?? "esc"}
          </text>
        </box>
        <text fg={tint(theme.borderSubtle, theme.primary, 0.25)} attributes={TextAttributes.DIM}>
          {"─".repeat(48)}
        </text>
      </box>
    </FadeIn>
  )
}

export function DialogButton(props: { label: string; active?: boolean; onPress: () => void; delay?: number }) {
  const { theme } = useTheme()
  const kv = useKV()
  const animations = () => kv.get("animations_enabled", true)
  const pulse = createPulse(() => !!props.active, animations, 1100)
  const marker = () => (props.active ? "◈" : "◇")
  const fg = () => fadeColor(props.active ? theme.primary : theme.textMuted, props.active ? pulse() : 1)

  return (
    <FadeIn delay={props.delay ?? 100} duration={180}>
      <box paddingLeft={1} paddingRight={1} onMouseUp={props.onPress}>
        <text fg={fg()}>
          <span style={{ fg: fg() }}>{marker()} </span>
          {props.label}
          <span style={{ fg: fg() }}> {marker()}</span>
        </text>
      </box>
    </FadeIn>
  )
}
