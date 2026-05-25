/** @jsxImportSource @opentui/solid */
import { RGBA, TextAttributes } from "@opentui/core"
import { useTerminalDimensions } from "@opentui/solid"
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js"
import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import {
  bindVoiceApi,
  stopVoice,
  subscribeVoice,
  toggleVoice,
  voiceActive,
  voiceElapsedLabel,
  voiceSnapshot,
} from "../../util/voice/controller"
import { readVoiceSettings } from "../../util/voice/voice-settings"
import { registerVoiceHotkeyIntercept } from "../../util/voice/voice-hotkey-intercept"
import { openVoiceSettings } from "./voice-settings-dialog"

export { openVoiceSettings } from "./voice-settings-dialog"

const LAYER_PRIORITY = 960
const HOTKEY_LAYER_PRIORITY = 4000

function ink(api: TuiPluginApi, name: string, fallback: string) {
  const value = Reflect.get(api.theme.current, name)
  if (typeof value === "string") return value
  if (value instanceof RGBA) return value
  return fallback
}

function VoiceFloatingPill(props: { api: TuiPluginApi }) {
  const dimensions = useTerminalDimensions()
  const [tick, setTick] = createSignal(0)
  const snap = () => voiceSnapshot()
  const settings = () => readVoiceSettings(props.api.kv)

  onMount(() => {
    const unsub = subscribeVoice(() => setTick((value) => value + 1))
    onCleanup(unsub)
  })

  createEffect(() => {
    if (!voiceActive()) return
    const timer = setInterval(() => setTick((value) => value + 1), 250)
    onCleanup(() => clearInterval(timer))
  })

  const width = createMemo(() => {
    tick()
    const term = dimensions().width
    return Math.min(40, Math.max(20, Math.floor(term * 0.32)))
  })

  const left = createMemo(() => {
    tick()
    return Math.max(0, dimensions().width - width() - 2)
  })

  const pulseIcon = () => {
    const frame = tick() % 4
    return snap().status === "transcribing" ? ["◐", "◓", "◑", "◒"][frame] : ["●", "◉", "○", "◉"][frame]
  }

  const statusColor = () => {
    if (snap().status === "transcribing") return ink(props.api, "info", "#6eb5ff")
    return ink(props.api, "error", "#ff6b6b")
  }

  const statusLabel = () => (snap().status === "transcribing" ? "think" : "rec")

  return (
    <Show when={voiceActive() && settings().showPill}>
      <box
        position="absolute"
        zIndex={3600}
        bottom={1}
        left={left()}
        width={width()}
        height={2}
        backgroundColor={ink(props.api, "backgroundMenu", "#141414")}
        borderStyle="rounded"
        borderColor={statusColor()}
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        paddingLeft={1}
        paddingRight={1}
        onMouseDown={() => {
          if (snap().status === "recording") void stopVoice(props.api)
        }}
      >
        <text wrapMode="none">
          <span style={{ fg: statusColor(), attributes: TextAttributes.BOLD }}>{pulseIcon()} </span>
          <span style={{ fg: ink(props.api, "textMuted", "#9a9a9a"), attributes: TextAttributes.BOLD }}>
            {statusLabel()}{" "}
          </span>
          <span style={{ fg: ink(props.api, "text", "#ececec") }}>{voiceElapsedLabel()} </span>
          <Show when={snap().status === "recording"}>
            <span style={{ fg: statusColor() }}>{snap().meter}</span>
          </Show>
        </text>
      </box>
    </Show>
  )
}

const tui: TuiPlugin = async (api) => {
  bindVoiceApi(api)
  registerVoiceHotkeyIntercept(api)

  const voiceBindings = () => api.tuiConfig.keybinds.get("voice.toggle")

  const commands = [
    {
      name: "voice.toggle",
      title: "Toggle voice dictation",
      desc: "Record speech with whisper.cpp (offline) into the prompt",
      category: "Prompt",
      namespace: "palette",
      slashAliases: ["dictate", "mic"],
      run() {
        void toggleVoice(api)
      },
    },
    {
      name: "voice.settings",
      title: "Voice settings",
      desc: "Configure offline dictation, hotkey, and model",
      category: "Prompt",
      namespace: "palette",
      slashName: "voice",
      run() {
        openVoiceSettings(api)
      },
    },
  ] as const

  api.keymap.registerLayer({
    priority: LAYER_PRIORITY - 10,
    commands: [...commands],
    bindings: voiceBindings(),
  })

  api.keymap.registerLayer({
    priority: HOTKEY_LAYER_PRIORITY,
    commands: [{ name: "voice.toggle", run: () => void toggleVoice(api) }],
    bindings: voiceBindings(),
  })

  api.slots.register({
    order: 210,
    slots: {
      app() {
        return <VoiceFloatingPill api={api} />
      },
    },
  })
}

const plugin: InternalTuiPlugin = {
  id: "internal:voice",
  tui,
}

export default plugin
