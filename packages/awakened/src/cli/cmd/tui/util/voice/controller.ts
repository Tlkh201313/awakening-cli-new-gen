import fs from "fs/promises"
import type { TuiPluginApi } from "@awakened-ai/plugin/tui"
import { assertRecordingFile, ffmpegAvailable, startVoiceRecorder, type VoiceRecorder } from "./recorder"
import { prepareVoiceUploadFile } from "./transcribe-upload"
import { transcribeVoiceFile } from "./transcribe"
import { sanitizeVoiceTranscript } from "./transcript-sanitize"
import { openVoiceSettings } from "../../feature-plugins/system/voice-settings-dialog"
import { applyVoiceSettings, readVoiceSettings } from "./voice-settings"
import { voiceHotkeyLabel } from "./voice-hotkey"
import { voiceHotkeyInterceptHint } from "./voice-hotkey-intercept"

export type VoiceStatus = "idle" | "recording" | "transcribing"

type VoiceSnapshot = {
  status: VoiceStatus
  elapsedMs: number
  meter: string
}

const METER_FRAMES = ["▁▂▃▅▇", "▂▃▅▇█", "▃▅▇█▇", "▅▇█▇▅", "▇█▇▅▃"]

const listeners = new Set<() => void>()

let status: VoiceStatus = "idle"
let startedAt = 0
let meterIndex = 0
let meterTimer: ReturnType<typeof setInterval> | undefined
let activeRecorder: VoiceRecorder | undefined
let apiRef: TuiPluginApi | undefined
let unregisterRecordingKeys: (() => void) | undefined

const RECORDING_KEY_PRIORITY = 50_000
const TOGGLE_STOP_GUARD_MS = 550

function notify() {
  for (const listener of [...listeners]) listener()
}

function setStatus(next: VoiceStatus) {
  status = next
  notify()
}

function startMeter() {
  if (meterTimer) clearInterval(meterTimer)
  meterTimer = setInterval(() => {
    meterIndex = (meterIndex + 1) % METER_FRAMES.length
    notify()
  }, 180)
}

function stopMeter() {
  if (meterTimer) clearInterval(meterTimer)
  meterTimer = undefined
  meterIndex = 0
}

process.on("exit", () => {
  if (meterTimer) clearInterval(meterTimer)
  if (activeRecorder) {
    try {
      activeRecorder.stop()
    } catch {}
  }
})

function releaseRecordingKeys() {
  unregisterRecordingKeys?.()
  unregisterRecordingKeys = undefined
}

function registerRecordingKeys(api: TuiPluginApi) {
  releaseRecordingKeys()
  unregisterRecordingKeys = api.keymap.registerLayer({
    priority: RECORDING_KEY_PRIORITY,
    commands: [
      {
        name: "voice.stop",
        title: "Stop voice recording",
        category: "Prompt",
        run() {
          void stopVoice(api)
        },
      },
      {
        name: "voice.cancel",
        title: "Cancel voice recording",
        category: "Prompt",
        run() {
          void cancelVoice()
        },
      },
    ],
    bindings: [
      { key: "return", command: "voice.stop", preventDefault: true },
      { key: "escape", command: "voice.cancel", preventDefault: true },
      { key: "ctrl+c", command: "voice.cancel", preventDefault: true },
    ],
  })
}

export function bindVoiceApi(api: TuiPluginApi) {
  apiRef = api
  applyVoiceSettings(readVoiceSettings(api.kv))
}

export function unbindVoiceApi() {
  apiRef = undefined
}

export function subscribeVoice(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function voiceSnapshot(): VoiceSnapshot {
  const elapsedMs = status !== "idle" && startedAt ? Date.now() - startedAt : 0
  return {
    status,
    elapsedMs,
    meter: status === "recording" ? (METER_FRAMES[meterIndex] ?? METER_FRAMES[0]) : "▁▁▁▁▁",
  }
}

export function voiceActive() {
  return status !== "idle"
}

export function isVoiceRecording() {
  return status === "recording"
}

export async function stopVoiceIfRecording() {
  if (status !== "recording" || !apiRef) return false
  await stopVoice(apiRef)
  return true
}

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function voiceElapsedLabel() {
  return formatElapsed(voiceSnapshot().elapsedMs)
}

async function appendTranscript(api: TuiPluginApi, text: string) {
  const trimmed = sanitizeVoiceTranscript(text)
  if (!trimmed) {
    api.ui.toast({
      variant: "warning",
      message: "Couldn't recognize speech — hold the hotkey while talking, then release. Check mic in /voice.",
      duration: 5000,
    })
    return
  }
  await api.client.tui.appendPrompt({ text: `${trimmed} ` })
  void api.attention.notify({ message: "Voice transcribed", sound: { name: "done" } })
  api.ui.toast({ variant: "success", message: "Voice → prompt", duration: 2500 })
}

async function beginRecording(api: TuiPluginApi) {
  const settings = readVoiceSettings(api.kv)
  if (!settings.enabled) {
    api.ui.toast({ variant: "info", message: "Voice disabled — open /voice settings", duration: 4000 })
    return
  }

  applyVoiceSettings(settings)

  if (!(await ffmpegAvailable())) {
    throw new Error("ffmpeg not found on PATH — install ffmpeg for microphone capture")
  }

  activeRecorder = await startVoiceRecorder(settings.device || undefined)
  startedAt = Date.now()
  setStatus("recording")
  startMeter()
  registerRecordingKeys(api)
}

async function finishRecording(api: TuiPluginApi) {
  const recorder = activeRecorder
  activeRecorder = undefined
  releaseRecordingKeys()
  stopMeter()
  if (!recorder) {
    setStatus("idle")
    startedAt = 0
    return
  }

  setStatus("transcribing")
  await recorder.stop()
  const file = recorder.file

  let upload: { file: string; extra: string[] } | undefined
  try {
    await assertRecordingFile(file)
    const settings = readVoiceSettings(api.kv)
    upload = await prepareVoiceUploadFile(file, settings.provider)
    const text = await transcribeVoiceFile(upload.file, settings, {
      onProgress(message) {
        api.ui.toast({ variant: "info", message, duration: 3000 })
      },
    })
    await appendTranscript(api, text)
  } finally {
    const paths = [file, ...(upload?.extra ?? [])]
    await Promise.all(paths.map((path) => fs.unlink(path).catch(() => undefined)))
    setStatus("idle")
    startedAt = 0
  }
}

export async function startVoice(api: TuiPluginApi) {
  if (status === "transcribing") return
  if (status === "recording") {
    await finishRecording(api)
    return
  }
  try {
    await beginRecording(api)
    const settings = readVoiceSettings(api.kv)
    const engine =
      settings.provider === "groq"
        ? "Groq (full clip)"
        : "local Whisper"
    api.ui.toast({
      variant: "info",
      message: `Recording… ${engine} · ${voiceHotkeyInterceptHint()} · ${voiceHotkeyLabel()} · Enter to stop`,
      duration: 6000,
    })
  } catch (error) {
    activeRecorder = undefined
    setStatus("idle")
    startedAt = 0
    stopMeter()
    api.ui.toast({
      variant: "error",
      message: error instanceof Error ? error.message : "Could not start voice recording",
      duration: 8000,
    })
  }
}

export async function stopVoice(api: TuiPluginApi) {
  if (status !== "recording") return
  try {
    await finishRecording(api)
  } catch (error) {
    setStatus("idle")
    startedAt = 0
    api.ui.toast({
      variant: "error",
      message: error instanceof Error ? error.message : "Voice transcription failed",
      duration: 8000,
    })
  }
}

export async function cancelVoice() {
  const recorder = activeRecorder
  activeRecorder = undefined
  releaseRecordingKeys()
  stopMeter()
  if (recorder) {
    await recorder.stop().catch(() => undefined)
    await fs.unlink(recorder.file).catch(() => undefined)
  }
  setStatus("idle")
  startedAt = 0
  apiRef?.ui.toast({ variant: "info", message: "Voice recording cancelled", duration: 2000 })
}

export { installVoiceDeps } from "./voice-install"

export async function startVoiceHold(api: TuiPluginApi) {
  if (!readVoiceSettings(api.kv).hotkeyEnabled) return
  if (!readVoiceSettings(api.kv).enabled) return
  if (status !== "idle") return
  await startVoice(api)
}

export async function stopVoiceHold(api: TuiPluginApi) {
  if (status !== "recording") return
  await stopVoice(api)
}

export async function toggleVoice(api: TuiPluginApi) {
  if (!readVoiceSettings(api.kv).hotkeyEnabled) {
    api.ui.toast({ variant: "info", message: "Voice hotkey disabled — /voice settings", duration: 4000 })
    return
  }
  if (!readVoiceSettings(api.kv).enabled) {
    api.ui.toast({ variant: "info", message: "Voice disabled — /voice settings", duration: 4000 })
    return
  }
  if (status === "recording" && Date.now() - startedAt < TOGGLE_STOP_GUARD_MS) return
  if (status === "recording") await stopVoice(api)
  else if (status === "idle") await startVoice(api)
}

export function dispatchVoiceSlash(name: string, args?: string) {
  const api = apiRef
  if (!api) return false
  if (name !== "voice" && name !== "dictate" && name !== "mic") return false

  const sub = args?.trim().split(/\s+/)[0]?.toLowerCase()
  if (sub === "stop") {
    void stopVoice(api)
    return true
  }
  if (sub === "cancel") {
    void cancelVoice()
    return true
  }
  if (sub === "install") {
    void import("./voice-install").then((m) => m.installVoiceDeps(api))
    return true
  }
  if (name === "dictate" || name === "mic") {
    void toggleVoice(api)
    return true
  }

  openVoiceSettings(api)
  return true
}
