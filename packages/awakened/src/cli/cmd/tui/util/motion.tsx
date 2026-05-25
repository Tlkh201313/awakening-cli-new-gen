import { createSignal, onMount, Show, type JSX, type ParentProps } from "solid-js"
import { useKV } from "../context/kv"
import { createDelayedFadeIn } from "./signal"

export function slideOffset(alpha: number, max = 2) {
  return Math.round((1 - alpha) * max)
}

export function FadeIn(props: ParentProps<{ delay?: number; duration?: number; children: JSX.Element }>) {
  const kv = useKV()
  const animations = () => kv.get("animations_enabled", true)
  const [ready, setReady] = createSignal(false)
  const alpha = createDelayedFadeIn(ready, animations, props.delay ?? 0, props.duration ?? 180)

  onMount(() => setReady(true))

  return (
    <Show when={alpha() > 0.02}>
      <box opacity={alpha()}>{props.children}</box>
    </Show>
  )
}

export function SlideFadeIn(
  props: ParentProps<{ delay?: number; duration?: number; slide?: number; axis?: "x" | "y"; children: JSX.Element }>,
) {
  const kv = useKV()
  const animations = () => kv.get("animations_enabled", true)
  const [ready, setReady] = createSignal(false)
  const alpha = createDelayedFadeIn(ready, animations, props.delay ?? 0, props.duration ?? 200)
  const axis = () => props.axis ?? "y"
  const slide = () => props.slide ?? 2

  onMount(() => setReady(true))

  return (
    <Show when={alpha() > 0.02}>
      <box
        opacity={alpha()}
        marginTop={axis() === "y" ? slideOffset(alpha(), slide()) : 0}
        marginLeft={axis() === "x" ? slideOffset(alpha(), slide()) : 0}
      >
        {props.children}
      </box>
    </Show>
  )
}
