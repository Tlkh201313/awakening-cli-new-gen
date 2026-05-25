import { Prompt, type PromptRef } from "@tui/component/prompt"
import { createEffect, createMemo, createSignal, onMount } from "solid-js"
import { useTerminalDimensions } from "@opentui/solid"
import { AwakenedBanner, HomeFrameBottom } from "../component/awakened-banner"
import { homeLayout, useHomeStyle } from "../context/home-style"
import { useSync } from "../context/sync"
import { Toast } from "../ui/toast"
import { useArgs } from "../context/args"
import { useRouteData } from "@tui/context/route"
import { usePromptRef } from "../context/prompt"
import { useLocal } from "../context/local"
import { TuiPluginRuntime } from "@/cli/cmd/tui/plugin/runtime"
import { useEditorContext } from "@tui/context/editor"
import { SlideFadeIn } from "../util/motion"
import { BANNER_ROW_FADE_MS, BANNER_ROW_STAGGER_MS } from "../util/banner-animation"
import { BANNER } from "@/cli/banner"

let once = false
const placeholder = {
  normal: ["Fix a TODO in the codebase", "What is the tech stack of this project?", "Fix broken tests"],
  shell: ["ls -la", "git status", "pwd"],
}

export function Home() {
  const sync = useSync()
  const route = useRouteData("home")
  const promptRef = usePromptRef()
  const [ref, setRef] = createSignal<PromptRef | undefined>()
  const args = useArgs()
  const local = useLocal()
  const editor = useEditorContext()
  const homeStyle = useHomeStyle()
  const dimensions = useTerminalDimensions()
  const layout = createMemo(() => homeLayout(dimensions().width, homeStyle.current()))
  const promptDelay = () => {
    if (!homeStyle.current().startupFx) return 120
    return (BANNER.length - 1) * BANNER_ROW_STAGGER_MS + BANNER_ROW_FADE_MS + 80
  }
  let sent = false

  onMount(() => {
    editor.clearSelection()
  })

  const bind = (r: PromptRef | undefined) => {
    setRef(r)
    promptRef.set(r)
    if (once || !r) return
    if (route.prompt) {
      r.set(route.prompt)
      once = true
      return
    }
    if (!args.prompt) return
    r.set({ input: args.prompt, parts: [] })
    once = true
  }

  // Wait for sync and model store to be ready before auto-submitting --prompt
  createEffect(() => {
    const r = ref()
    if (sent) return
    if (!r) return
    if (!sync.ready || !local.model.ready) return
    if (!args.prompt) return
    if (r.current.input !== args.prompt) return
    sent = true
    r.submit()
  })

  return (
    <>
      <box flexGrow={1} alignItems="center" paddingLeft={2} paddingRight={2}>
        <box flexGrow={1} minHeight={0} />
        <box flexShrink={0}>
          <TuiPluginRuntime.Slot name="home_logo" mode="replace">
            <AwakenedBanner />
          </TuiPluginRuntime.Slot>
        </box>
        <box height={1} minHeight={0} flexShrink={1} />
        <SlideFadeIn delay={promptDelay()} duration={240} slide={2}>
          <box width="100%" maxWidth={layout().promptMaxWidth} zIndex={1000} paddingTop={layout().showFrame ? 0 : 1} flexShrink={0}>
            <TuiPluginRuntime.Slot name="home_prompt" mode="replace" ref={bind}>
              <Prompt
                ref={bind}
                right={<TuiPluginRuntime.Slot name="home_prompt_right" />}
                placeholders={placeholder}
                borderStyle={layout().promptBorder}
              />
            </TuiPluginRuntime.Slot>
          </box>
        </SlideFadeIn>
        <HomeFrameBottom />
        <TuiPluginRuntime.Slot name="home_bottom" />
        <box flexGrow={1} minHeight={0} />
        <Toast />
      </box>
      <box width="100%" flexShrink={0}>
        <TuiPluginRuntime.Slot name="home_footer" mode="single_winner" />
      </box>
    </>
  )
}
