import { createMemo, onMount, Show, type JSX } from "solid-js"
import { useTheme } from "../context/theme"
import { useKV } from "../context/kv"
import { createColors, createFrames } from "../ui/spinner"
import { fadeColor } from "../util/color"
import { createFadeTransition } from "../util/signal"
import type { RGBA } from "@opentui/core"
import "opentui-spinner/solid"

export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

export function Spinner(props: {
  children?: JSX.Element
  color?: RGBA
  style?: "braille" | "scanner"
  visible?: () => boolean
  fade?: boolean
}) {
  const { theme } = useTheme()
  const kv = useKV()
  const color = () => props.color ?? theme.primary
  const animations = () => kv.get("animations_enabled", true)
  const visible = () => props.visible?.() ?? true
  const alpha = props.fade === false ? () => 1 : createFadeTransition(visible, animations, 160)

  const scanner = createMemo(() => {
    if (props.style !== "scanner") return
    return {
      frames: createFrames({
        color: color(),
        style: "diamonds",
        width: 6,
        holdStart: 10,
        holdEnd: 5,
        inactiveFactor: 0.45,
        minAlpha: 0.2,
      }),
      color: createColors({
        color: color(),
        style: "diamonds",
        width: 6,
        holdStart: 10,
        holdEnd: 5,
        inactiveFactor: 0.45,
        minAlpha: 0.2,
      }),
    }
  })

  return (
    <Show when={alpha() > 0.02}>
      <box flexDirection="row" gap={1} opacity={alpha()} alignItems="center">
        <Show
          when={animations()}
          fallback={
            <text fg={fadeColor(color(), alpha())}>
              ⋯
              <Show when={props.children}> {props.children}</Show>
            </text>
          }
        >
          <Show
            when={props.style === "scanner" && scanner()}
            fallback={<spinner frames={SPINNER_FRAMES} interval={72} color={color()} />}
          >
            <spinner frames={scanner()!.frames} color={scanner()!.color} interval={42} />
          </Show>
          <Show when={props.children}>
            <text fg={fadeColor(theme.textMuted, alpha())}>{props.children}</text>
          </Show>
        </Show>
      </box>
    </Show>
  )
}
