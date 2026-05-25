export {
  ensureWhisperLocal,
  transcribeWithWhisperLocal,
  voiceDataDir,
  voiceInstallHint,
  VOICE_MODELS,
  type VoiceModelId,
} from "./whisper-local"

export {
  GROQ_WHISPER_MODELS,
  transcribeWithGroq,
  resolveGroqApiKey,
  nextGroqModel,
  type GroqWhisperModelId,
} from "./transcribe-groq"

import type { VoiceSettings } from "./voice-settings"
import { resolveGroqApiKeyAll } from "./voice-groq-auth"
import { transcribeWithGroq } from "./transcribe-groq"
import { transcribeWithWhisperLocal } from "./whisper-local"

export async function transcribeVoiceFile(
  file: string,
  settings: VoiceSettings,
  options?: { onProgress?: (message: string) => void },
) {
  if (settings.provider === "groq") {
    const apiKey = await resolveGroqApiKeyAll(settings.groqApiKey)
    return transcribeWithGroq(file, {
      apiKey,
      model: settings.groqModel,
      onProgress: options?.onProgress,
    })
  }
  return transcribeWithWhisperLocal(file, options)
}
