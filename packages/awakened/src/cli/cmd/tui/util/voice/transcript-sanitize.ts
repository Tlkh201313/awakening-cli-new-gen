/** Phrases Whisper often hallucinates on silence / short clips. */
const HALLUCINATION_PHRASES = new Set([
  "you",
  "yeah",
  "uh",
  "um",
  "hmm",
  "bye",
  "thanks",
  "thank you",
  "thanks for watching",
  "subscribe",
  "please subscribe",
  "see you next time",
  "thank you for watching",
  "okay",
  "ok",
  "so",
  "the",
  "and",
  "music",
  "applause",
  "laughter",
  "i don't know",
  "i do not know",
  "i dont know",
  "thanks for listening",
  "thank you for listening",
  "bye bye",
  "goodbye",
  "hello hello",
  "testing testing",
  "one two three",
])

function normalizePhrase(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function isVoiceHallucinationPhrase(text: string) {
  const phrase = normalizePhrase(text)
  if (!phrase) return true
  return HALLUCINATION_PHRASES.has(phrase)
}

export function voiceSegmentLooksValid(segment: {
  text?: string
  no_speech_prob?: number
  avg_logprob?: number
  compression_ratio?: number
}) {
  if ((segment.no_speech_prob ?? 0) > 0.45) return false
  if ((segment.avg_logprob ?? 0) < -0.85) return false
  if ((segment.compression_ratio ?? 0) > 2.4) return false
  const text = segment.text?.trim()
  if (!text || isVoiceHallucinationPhrase(text)) return false
  return true
}

export function textFromVoiceSegments(
  segments: { text?: string; no_speech_prob?: number; avg_logprob?: number; compression_ratio?: number }[],
) {
  const parts = segments.filter(voiceSegmentLooksValid).map((segment) => segment.text?.trim() ?? "").filter(Boolean)
  if (!parts.length) return ""
  return sanitizeVoiceTranscript(parts.join(" "))
}

function splitSentences(text: string) {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length ? parts : [text.trim()].filter(Boolean)
}

function dedupeSentences(sentences: string[]) {
  const out: string[] = []
  for (const sentence of sentences) {
    const norm = normalizePhrase(sentence)
    if (!norm) continue
    if (out.length && normalizePhrase(out[out.length - 1] ?? "") === norm) continue
    out.push(sentence)
  }
  return out
}

/** Drop silence hallucinations and repeated filler sentences. */
export function sanitizeVoiceTranscript(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return ""

  const sentences = splitSentences(trimmed)
  const kept = sentences.filter((sentence) => !isVoiceHallucinationPhrase(sentence))
  if (!kept.length) return ""

  const words = trimmed.split(/\s+/).filter(Boolean)
  const lower = words.map((word) => word.toLowerCase().replace(/[^a-z0-9']/g, ""))
  const unique = new Set(lower)
  if (unique.size === 1 && words.length >= 2) {
    const token = [...unique][0] ?? ""
    if (HALLUCINATION_PHRASES.has(token) || token.length <= 3) return ""
  }

  return dedupeSentences(kept).join(" ").replace(/\s+/g, " ").trim()
}
