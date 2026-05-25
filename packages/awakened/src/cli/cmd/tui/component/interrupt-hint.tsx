import { TextAttributes } from "@opentui/core"
import { createEffect, createSignal, onCleanup, Show, type Accessor } from "solid-js"
import { useTheme } from "../context/theme"
import { useKV } from "../context/kv"
import { fadeColor } from "../util/color"
import { createFadeTransition, createPulse } from "../util/signal"

const COUNTDOWN_MS = 5000

function InterruptCountdown(props: { active: Accessor<boolean>; animations: Accessor<boolean> }) {
  const { theme } = useTheme()
  const [progress, setProgress] = createSignal(1)

  createEffect(() => {
    if (!props.active() || !props.animations()) {
      setProgress(1)
      return
    }

    const start = performance.now()
    const timer = setInterval(() => {
      const elapsed = performance.now() - start
      setProgress(Math.max(0, 1 - elapsed / COUNTDOWN_MS))
      if (elapsed >= COUNTDOWN_MS) clearInterval(timer)
    }, 48)

    onCleanup(() => clearInterval(timer))
  })

  const filled = () => Math.max(0, Math.ceil(progress() * 5))

  return (
    <text fg={theme.textMuted}>
      {"◆".repeat(filled())}
      {"◇".repeat(Math.max(0, 5 - filled()))}
    </text>
  )
}

export function InterruptHint(props: { active: boolean; count: number }) {
  const { theme } = useTheme()
  const kv = useKV()
  const animations = () => kv.get("animations_enabled", true)
  const visible = () => props.active
  const alpha = createFadeTransition(visible, animations, 180)
  const urgent = () => props.count > 0
  const pulse = createPulse(urgent, animations, 750)

  return (
    <Show when={alpha() > 0.02}>
      <box flexDirection="row" gap={1} alignItems="center" opacity={alpha()}>
        <text
          attributes={TextAttributes.BOLD}
          fg={fadeColor(urgent() ? theme.primary : theme.textMuted, urgent() ? pulse() : 1)}
        >
          ◈ esc ◈
        </text>
        <text fg={urgent() ? fadeColor(theme.primary, pulse()) : theme.textMuted}>
          {urgent() ? "again to interrupt" : "interrupt"}
        </text>
        <Show when={urgent()}>
          <InterruptCountdown active={() => props.count > 0} animations={animations} />
        </Show>
      </box>
    </Show>
  )
}
