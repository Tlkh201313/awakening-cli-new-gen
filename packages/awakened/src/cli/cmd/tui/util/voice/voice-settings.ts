import type { TuiPluginApi } from "@awakened-ai/plugin/tui"
import { resolveGroqApiKey, type GroqWhisperModelId } from "./transcribe-groq"
import { VOICE_MODELS, voiceModelFromEnv, type VoiceModelId } from "./whisper-local"

export type VoiceTranscriptionProvider = "local" | "groq"

export type VoiceSettings = {
  enabled: boolean
  showPill: boolean
  hotkeyEnabled: boolean
  provider: VoiceTranscriptionProvider
  model: VoiceModelId
  groqModel: GroqWhisperModelId
  groqApiKey: string
  device: string
}

const defaultModel = () => voiceModelFromEnv()

export function readVoiceSettings(kv: TuiPluginApi["kv"]): VoiceSettings {
  const model = kv.get("voice_model", defaultModel())
  const groqApiKey = resolveGroqApiKey(kv.get("voice_groq_api_key", "") ?? "")
  const storedProvider = kv.get("voice_transcription_provider", "") as VoiceTranscriptionProvider | ""
  const provider: VoiceTranscriptionProvider =
    storedProvider === "local" || storedProvider === "groq"
      ? storedProvider
      : groqApiKey
        ? "groq"
        : "local"

  const groqModel = kv.get("voice_groq_model", "turbo") as string
  return {
    enabled: kv.get("voice_enabled", true),
    showPill: kv.get("voice_show_pill", true),
    hotkeyEnabled: kv.get("voice_hotkey_enabled", true),
    provider,
    model: model in VOICE_MODELS ? (model as VoiceModelId) : defaultModel(),
    groqModel:
      groqModel === "large" || groqModel === "distil" || groqModel === "turbo" ? groqModel : "turbo",
    groqApiKey,
    device: kv.get("voice_device", "") ?? "",
  }
}

export function applyVoiceSettings(settings: VoiceSettings) {
  if (settings.provider === "local") process.env.AWAKENED_VOICE_MODEL = settings.model
  if (settings.device.trim()) process.env.AWAKENED_VOICE_DEVICE = settings.device.trim()
  else delete process.env.AWAKENED_VOICE_DEVICE
  if (settings.groqApiKey.trim()) process.env.GROQ_API_KEY = settings.groqApiKey.trim()
}

export { voiceHotkeyLabel } from "./voice-hotkey"

export function nextVoiceModel(model: VoiceModelId) {
  const ids = Object.keys(VOICE_MODELS) as VoiceModelId[]
  const index = ids.indexOf(model)
  return ids[(index + 1) % ids.length] ?? ids[0]
}

export function nextVoiceProvider(provider: VoiceTranscriptionProvider) {
  return provider === "local" ? "groq" : "local"
}
