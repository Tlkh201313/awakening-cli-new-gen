import { createEffect, createMemo, createSignal, onCleanup, Show } from "solid-js"
import { AwakenedDialogBorder } from "@tui/component/border"
import { useTheme } from "../context/theme"
import { useKV } from "../context/kv"
import { fadeBackground, fadeColor } from "../util/color"
import { createFadeTransition } from "../util/signal"
import { Spinner } from "./spinner"

export function StartupLoading(props: { ready: () => boolean }) {
  const { theme } = useTheme()
  const kv = useKV()
  const animations = () => kv.get("animations_enabled", true)
  const [mounted, setMounted] = createSignal(false)
  const [visible, setVisible] = createSignal(false)
  const alpha = createFadeTransition(visible, animations, 220)
  const text = createMemo(() => (props.ready() ? "Finishing startup..." : "Loading plugins..."))
  let wait: NodeJS.Timeout | undefined
  let hold: NodeJS.Timeout | undefined
  let fadeOut: NodeJS.Timeout | undefined
  let stamp = 0

  createEffect(() => {
    if (props.ready()) {
      if (wait) {
        clearTimeout(wait)
        wait = undefined
      }
      if (!mounted()) return
      if (hold) return

      const left = 2800 - (Date.now() - stamp)
      if (left <= 0) {
        setVisible(false)
        fadeOut = setTimeout(() => {
          fadeOut = undefined
          setMounted(false)
        }, animations() ? 240 : 0).unref()
        return
      }

      hold = setTimeout(() => {
        hold = undefined
        setVisible(false)
        fadeOut = setTimeout(() => {
          fadeOut = undefined
          setMounted(false)
        }, animations() ? 240 : 0).unref()
      }, left).unref()
      return
    }

    if (hold) {
      clearTimeout(hold)
      hold = undefined
    }
    if (fadeOut) {
      clearTimeout(fadeOut)
      fadeOut = undefined
    }
    if (mounted()) return
    if (wait) return

    wait = setTimeout(() => {
      wait = undefined
      stamp = Date.now()
      setMounted(true)
      setVisible(true)
    }, 400).unref()
  })

  onCleanup(() => {
    if (wait) clearTimeout(wait)
    if (hold) clearTimeout(hold)
    if (fadeOut) clearTimeout(fadeOut)
  })

  return (
    <Show when={mounted()}>
      <box
        position="absolute"
        zIndex={5000}
        left={0}
        right={0}
        top={0}
        bottom={0}
        justifyContent="center"
        alignItems="center"
        backgroundColor={fadeBackground(alpha(), 120)}
      >
        <box
          opacity={alpha()}
          border={AwakenedDialogBorder.border}
          borderColor={fadeColor(theme.primary, alpha())}
          backgroundColor={fadeColor(theme.backgroundPanel, alpha())}
          customBorderChars={AwakenedDialogBorder.customBorderChars}
          paddingLeft={2}
          paddingRight={2}
          paddingTop={1}
          paddingBottom={1}
        >
          <Spinner color={theme.primary} style="scanner" fade={false} visible={() => visible()}>
            {text()}
          </Spinner>
        </box>
      </box>
    </Show>
  )
}
