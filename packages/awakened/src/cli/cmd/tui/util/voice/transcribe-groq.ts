import { sanitizeVoiceTranscript, textFromVoiceSegments } from "./transcript-sanitize"

export const GROQ_WHISPER_MODELS = {
  turbo: { id: "whisper-large-v3-turbo", label: "Whisper Large v3 Turbo" },
  large: { id: "whisper-large-v3", label: "Whisper Large v3" },
  distil: { id: "distil-whisper-large-v3-en", label: "Distil Whisper (English)" },
} as const

export type GroqWhisperModelId = keyof typeof GROQ_WHISPER_MODELS

type GroqSegment = {
  text?: string
  no_speech_prob?: number
  avg_logprob?: number
  compression_ratio?: number
}

export function resolveGroqApiKey(settingsKey?: string) {
  const fromSettings = settingsKey?.trim()
  if (fromSettings) return fromSettings
  return process.env.GROQ_API_KEY?.trim() || ""
}

export function nextGroqModel(model: GroqWhisperModelId) {
  const ids = Object.keys(GROQ_WHISPER_MODELS) as GroqWhisperModelId[]
  return ids[(ids.indexOf(model) + 1) % ids.length] ?? ids[0]
}

export async function transcribeWithGroq(
  file: string,
  options: { apiKey: string; model?: GroqWhisperModelId; language?: string; onProgress?: (message: string) => void },
) {
  const apiKey = options.apiKey.trim()
  if (!apiKey) {
    throw new Error("Groq API key missing — set in /voice → Groq API key, GROQ_API_KEY, or /connect groq")
  }

  const modelId = GROQ_WHISPER_MODELS[options.model ?? "turbo"].id
  options.onProgress?.(`Transcribing with Groq (${modelId})…`)

  const form = new FormData()
  form.append("file", Bun.file(file))
  form.append("model", modelId)
  form.append("response_format", "verbose_json")
  form.append("temperature", "0")
  if (options.language) form.append("language", options.language)
  else form.append("language", "en")

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(body.trim() || `Groq transcription failed (${response.status})`)
  }

  const payload = (await response.json()) as { text?: string; segments?: GroqSegment[] }
  const fromSegments = payload.segments?.length ? textFromVoiceSegments(payload.segments) : ""
  const text = fromSegments || sanitizeVoiceTranscript(payload.text?.trim() ?? "")
  if (!text) throw new Error("Groq could not recognize speech in the recording — hold the hotkey longer and check /voice mic")
  return text
}
