/** @jsxImportSource @opentui/solid */
import { createMemo, createSignal, onMount } from "solid-js"
import type { TuiPluginApi } from "@awakened-ai/plugin/tui"
import { useTheme } from "@tui/context/theme"
import { useDialog } from "@tui/ui/dialog"
import { useSDK } from "@tui/context/sdk"
import { useSync } from "@tui/context/sync"
import { DialogSelect, type DialogSelectOption } from "@tui/ui/dialog-select"
import { installVoiceDeps } from "../../util/voice/voice-install"
import {
  nextVoiceModel,
  readVoiceSettings,
  voiceHotkeyLabel,
  type VoiceSettings,
  type VoiceTranscriptionProvider,
} from "../../util/voice/voice-settings"
import { ffmpegAvailable } from "../../util/voice/recorder"
import {
  ensureWhisperLocal,
  GROQ_WHISPER_MODELS,
  nextGroqModel,
  resolveGroqApiKey,
  VOICE_MODELS,
  type GroqWhisperModelId,
  type VoiceModelId,
} from "../../util/voice/transcribe"
import { resolveGroqApiKeyAll, testGroqConnection } from "../../util/voice/voice-groq-auth"

const GROQ_PROVIDER_ID = "groq"

type SettingAction =
  | { kind: "enabled" }
  | { kind: "pill" }
  | { kind: "hotkey" }
  | { kind: "use-groq" }
  | { kind: "use-local" }
  | { kind: "groq-model" }
  | { kind: "groq-key" }
  | { kind: "groq-connect" }
  | { kind: "groq-test" }
  | { kind: "model" }
  | { kind: "device" }
  | { kind: "install" }

function groqKeyLabel(key: string) {
  if (!key) return "Not set"
  if (key.length <= 10) return "Set"
  return `${key.slice(0, 7)}…${key.slice(-4)}`
}

function VoiceSettingsDialog(props: { api: TuiPluginApi }) {
  const dialog = useDialog()
  const sdk = useSDK()
  const sync = useSync()
  const { theme } = useTheme()

  const initial = () => readVoiceSettings(props.api.kv)
  const [enabled, setEnabled] = createSignal(initial().enabled)
  const [showPill, setShowPill] = createSignal(initial().showPill)
  const [hotkeyEnabled, setHotkeyEnabled] = createSignal(initial().hotkeyEnabled)
  const [provider, setProvider] = createSignal<VoiceTranscriptionProvider>(initial().provider)
  const [model, setModel] = createSignal<VoiceModelId>(initial().model)
  const [groqModel, setGroqModel] = createSignal<GroqWhisperModelId>(initial().groqModel)
  const [groqApiKey, setGroqApiKey] = createSignal(initial().groqApiKey)
  const [device, setDevice] = createSignal(initial().device)
  const [whisperOk, setWhisperOk] = createSignal<boolean | undefined>()
  const [groqReady, setGroqReady] = createSignal<boolean | undefined>()
  const [groqTesting, setGroqTesting] = createSignal(false)

  const refreshGroqReady = async () => {
    const key = await resolveGroqApiKeyAll(groqApiKey())
    setGroqReady(Boolean(key))
  }

  onMount(() => {
    dialog.setSize("large")
    void ffmpegAvailable()
    void ensureWhisperLocal()
      .then(() => setWhisperOk(true))
      .catch(() => setWhisperOk(false))
    void refreshGroqReady()
  })

  const groqConnected = () => sync.data.provider_next.connected.includes(GROQ_PROVIDER_ID)

  const persist = (patch: Partial<VoiceSettings>) => {
    if (patch.enabled !== undefined) {
      setEnabled(patch.enabled)
      props.api.kv.set("voice_enabled", patch.enabled)
    }
    if (patch.showPill !== undefined) {
      setShowPill(patch.showPill)
      props.api.kv.set("voice_show_pill", patch.showPill)
    }
    if (patch.hotkeyEnabled !== undefined) {
      setHotkeyEnabled(patch.hotkeyEnabled)
      props.api.kv.set("voice_hotkey_enabled", patch.hotkeyEnabled)
    }
    if (patch.provider !== undefined) {
      setProvider(patch.provider)
      props.api.kv.set("voice_transcription_provider", patch.provider)
    }
    if (patch.model !== undefined) {
      setModel(patch.model)
      props.api.kv.set("voice_model", patch.model)
    }
    if (patch.groqModel !== undefined) {
      setGroqModel(patch.groqModel)
      props.api.kv.set("voice_groq_model", patch.groqModel)
    }
    if (patch.groqApiKey !== undefined) {
      setGroqApiKey(patch.groqApiKey)
      props.api.kv.set("voice_groq_api_key", patch.groqApiKey)
    }
    if (patch.device !== undefined) {
      setDevice(patch.device)
      props.api.kv.set("voice_device", patch.device)
    }
    void refreshGroqReady()
  }

  const openGroqKeyPrompt = () => {
    props.api.ui.dialog.replace(() => (
      <props.api.ui.DialogPrompt
        title="Groq API key"
        placeholder="gsk_…"
        value={groqApiKey()}
        description={() => (
          <text>
            {`Cloud Whisper transcription via Groq.\nAlso saved for Groq chat if you use provider "${GROQ_PROVIDER_ID}".\nEnv: ${resolveGroqApiKey("") ? "GROQ_API_KEY set" : "GROQ_API_KEY not set"}`}
          </text>
        )}
        onConfirm={async (value) => {
          const key = value.trim()
          if (key) {
            await sdk.client.auth.set({
              providerID: GROQ_PROVIDER_ID,
              auth: { type: "api", key },
            })
            await sdk.client.instance.dispose()
            await sync.bootstrap()
          }
          persist({ groqApiKey: key, provider: "groq" })
          props.api.ui.dialog.replace(() => <VoiceSettingsDialog api={props.api} />)
        }}
        onCancel={() => {
          props.api.ui.dialog.replace(() => <VoiceSettingsDialog api={props.api} />)
        }}
      />
    ))
  }

  const onSelect = (action: SettingAction) => {
    if (action.kind === "enabled") persist({ enabled: !enabled() })
    if (action.kind === "pill") persist({ showPill: !showPill() })
    if (action.kind === "hotkey") persist({ hotkeyEnabled: !hotkeyEnabled() })
    if (action.kind === "use-groq") persist({ provider: "groq" })
    if (action.kind === "use-local") persist({ provider: "local" })
    if (action.kind === "model") persist({ model: nextVoiceModel(model()) })
    if (action.kind === "groq-model") persist({ groqModel: nextGroqModel(groqModel()) })
    if (action.kind === "groq-key" || action.kind === "groq-connect") openGroqKeyPrompt()
    if (action.kind === "groq-test") {
      if (groqTesting()) return
      setGroqTesting(true)
      void resolveGroqApiKeyAll(groqApiKey())
        .then(async (key) => {
          await testGroqConnection(key)
          props.api.ui.toast({ variant: "success", message: "Groq API key works", duration: 4000 })
          setGroqReady(true)
        })
        .catch((error) => {
          props.api.ui.toast({
            variant: "error",
            message: error instanceof Error ? error.message : "Groq test failed",
            duration: 8000,
          })
          setGroqReady(false)
        })
        .finally(() => setGroqTesting(false))
    }
    if (action.kind === "device") {
      props.api.ui.dialog.replace(() => (
        <props.api.ui.DialogPrompt
          title="Microphone device"
          placeholder={process.platform === "win32" ? "e.g. Microphone" : "default"}
          value={device()}
          description={() => (
            <text>
              {`Leave empty for default capture.\nWindows: ffmpeg dshow · macOS: avfoundation · Linux: pulse`}
            </text>
          )}
          onConfirm={(value) => {
            persist({ device: value.trim() })
            props.api.ui.dialog.replace(() => <VoiceSettingsDialog api={props.api} />)
          }}
          onCancel={() => {
            props.api.ui.dialog.replace(() => <VoiceSettingsDialog api={props.api} />)
          }}
        />
      ))
    }
    if (action.kind === "install") void installVoiceDeps(props.api)
  }

  const groqStatusText = () => {
    if (groqTesting()) return "Testing Groq API…"
    if (groqReady() === true) return groqConnected() ? "Ready · Groq provider connected" : "Ready · API key configured"
    if (groqReady() === false) return "API key required"
    return "Checking…"
  }

  const options = createMemo((): DialogSelectOption<SettingAction>[] => {
    const key = groqApiKey()
    const general = [
      {
        value: { kind: "enabled" } as SettingAction,
        title: "Voice dictation",
        description: enabled() ? `On — ${voiceHotkeyLabel()} · Enter stops recording` : "Off",
        category: "General",
        gutter: () => <text fg={enabled() ? theme.success : theme.textMuted}>{enabled() ? "✓" : " "}</text>,
        onSelect: () => onSelect({ kind: "enabled" }),
      },
      {
        value: { kind: "hotkey" } as SettingAction,
        title: `Hotkey (${voiceHotkeyLabel()})`,
        description: hotkeyEnabled() ? "Toggle record in Awakened" : "Disabled",
        category: "General",
        gutter: () => (
          <text fg={hotkeyEnabled() ? theme.success : theme.textMuted}>{hotkeyEnabled() ? "✓" : " "}</text>
        ),
        onSelect: () => onSelect({ kind: "hotkey" }),
      },
      {
        value: { kind: "pill" } as SettingAction,
        title: "Corner status pill",
        description: showPill() ? "Visible while recording" : "Hidden",
        category: "General",
        gutter: () => <text fg={showPill() ? theme.success : theme.textMuted}>{showPill() ? "✓" : " "}</text>,
        onSelect: () => onSelect({ kind: "pill" }),
      },
    ]

    const engine = [
      {
        value: { kind: "use-groq" } as SettingAction,
        title: "Groq cloud (recommended)",
        description: "Fast Whisper via Groq API — needs API key",
        category: "Engine",
        gutter: () => (
          <text fg={provider() === "groq" ? theme.success : theme.textMuted}>{provider() === "groq" ? "✓" : " "}</text>
        ),
        onSelect: () => onSelect({ kind: "use-groq" }),
      },
      {
        value: { kind: "use-local" } as SettingAction,
        title: "Local whisper.cpp",
        description: "Offline · ffmpeg + downloaded model",
        category: "Engine",
        gutter: () => (
          <text fg={provider() === "local" ? theme.success : theme.textMuted}>
            {provider() === "local" ? "✓" : " "}
          </text>
        ),
        onSelect: () => onSelect({ kind: "use-local" }),
      },
    ]

    const groq = [
      {
        value: { kind: "groq-key" } as SettingAction,
        title: "Groq API key",
        description: groqKeyLabel(key) + " · " + groqStatusText(),
        category: "Groq",
        gutter: () => (
          <text fg={groqReady() ? theme.success : theme.error}>{groqReady() ? "✓" : " "}</text>
        ),
        onSelect: () => onSelect({ kind: "groq-key" }),
      },
      {
        value: { kind: "groq-connect" } as SettingAction,
        title: "Set Groq key (voice + chat)",
        description: "Saves to Awakened auth — same as /connect groq",
        category: "Groq",
        onSelect: () => onSelect({ kind: "groq-connect" }),
      },
      {
        value: { kind: "groq-test" } as SettingAction,
        title: "Test Groq connection",
        description: groqTesting() ? "Calling Groq API…" : "Verify key before dictating",
        category: "Groq",
        disabled: groqTesting(),
        onSelect: () => onSelect({ kind: "groq-test" }),
      },
      {
        value: { kind: "groq-model" } as SettingAction,
        title: `Groq Whisper model: ${GROQ_WHISPER_MODELS[groqModel()].label}`,
        description: GROQ_WHISPER_MODELS[groqModel()].id,
        category: "Groq",
        onSelect: () => onSelect({ kind: "groq-model" }),
      },
    ]

    const local = [
      {
        value: { kind: "model" } as SettingAction,
        title: `Local model: ${VOICE_MODELS[model()].label}`,
        description: VOICE_MODELS[model()].file,
        category: "Local whisper",
        onSelect: () => onSelect({ kind: "model" }),
      },
      {
        value: { kind: "install" } as SettingAction,
        title: "Install / update whisper.cpp",
        description:
          whisperOk() === true ? "Ready" : whisperOk() === false ? "Not installed" : "Checking…",
        category: "Local whisper",
        onSelect: () => onSelect({ kind: "install" }),
      },
    ]

    return [
      ...general,
      ...engine,
      ...groq,
      ...(provider() === "local" ? local : []),
      {
        value: { kind: "device" } as SettingAction,
        title: "Microphone device",
        description: device().trim() || "System default",
        category: "Capture",
        onSelect: () => onSelect({ kind: "device" }),
      },
    ]
  })

  return (
    <DialogSelect<SettingAction>
      title="Voice settings"
      placeholder="Search…"
      options={options()}
      flat={true}
      skipFilter={true}
      footerHints={[
        { title: "↑↓", label: "navigate", side: "left" },
        { title: "return", label: "select", side: "left" },
        { title: "escape", label: "close", side: "right" },
      ]}
    />
  )
}

export function openVoiceSettings(api: TuiPluginApi) {
  api.ui.dialog.replace(() => <VoiceSettingsDialog api={api} />)
}
