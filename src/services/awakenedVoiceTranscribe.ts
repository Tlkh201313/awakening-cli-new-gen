/**
 * Provider-specific transcription (Groq / Deepgram / Hugging Face / compatible).
 */
import type { AwakenedVoiceSttSettings } from '../voice/awakenedVoiceConfig.js'
import { logForDebugging } from '../utils/debug.js'
import { sleep } from '../utils/sleep.js'

async function transcribeGroqCompatible(
  wav: Buffer,
  settings: AwakenedVoiceSttSettings,
  language?: string,
): Promise<string> {
  const boundary = `----AwakenedVoice${Date.now()}`
  const parts: Buffer[] = []
  const push = (s: string) => parts.push(Buffer.from(s))

  push(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.wav"\r\nContent-Type: audio/wav\r\n\r\n`,
  )
  parts.push(wav)
  push(
    `\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${settings.model}\r\n`,
  )
  if (language && language !== 'en') {
    push(
      `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${language}\r\n`,
    )
  }
  push(`--${boundary}--\r\n`)

  const url = `${settings.baseUrl}/audio/transcriptions`
  logForDebugging(`[awakened_voice] POST ${url} (${wav.length} bytes)`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: Buffer.concat(parts),
    signal: AbortSignal.timeout(120_000),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `STT HTTP ${response.status}: ${text.slice(0, 300) || response.statusText}`,
    )
  }

  const parsed = JSON.parse(text) as { text?: string }
  return parsed.text?.trim() ?? ''
}

async function transcribeDeepgram(
  wav: Buffer,
  settings: AwakenedVoiceSttSettings,
  language?: string,
): Promise<string> {
  const params = new URLSearchParams({
    model: settings.model,
    smart_format: 'true',
    punctuate: 'true',
  })
  if (language) params.set('language', language)

  const url = `${settings.baseUrl}/listen?${params.toString()}`
  logForDebugging(`[awakened_voice] POST ${url} (${wav.length} bytes)`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${settings.apiKey}`,
      'Content-Type': 'audio/wav',
    },
    body: wav,
    signal: AbortSignal.timeout(120_000),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `Deepgram HTTP ${response.status}: ${text.slice(0, 300) || response.statusText}`,
    )
  }

  const parsed = JSON.parse(text) as {
    results?: {
      channels?: Array<{
        alternatives?: Array<{ transcript?: string }>
      }>
    }
  }
  return (
    parsed.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? ''
  )
}

async function transcribeHuggingFace(
  wav: Buffer,
  settings: AwakenedVoiceSttSettings,
): Promise<string> {
  const modelId = settings.model.includes('/')
    ? settings.model
    : `openai/${settings.model}`
  const url = `${settings.baseUrl}/models/${modelId}`
  logForDebugging(`[awakened_voice] POST ${url} (${wav.length} bytes)`)

  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'audio/wav',
        'x-wait-for-model': 'true',
      },
      body: wav,
      signal: AbortSignal.timeout(120_000),
    })

    const text = await response.text()
    if (response.status === 503 && attempt < 3) {
      let waitMs = 2000
      try {
        const body = JSON.parse(text) as { estimated_time?: number }
        if (body.estimated_time) waitMs = Math.min(body.estimated_time * 1000, 20_000)
      } catch {
        /* use default wait */
      }
      logForDebugging(`[awakened_voice] HF model loading, retry in ${waitMs}ms`)
      await sleep(waitMs)
      continue
    }

    if (!response.ok) {
      throw new Error(
        `Hugging Face HTTP ${response.status}: ${text.slice(0, 300) || response.statusText}`,
      )
    }

    const parsed = JSON.parse(text) as { text?: string; error?: string }
    if (parsed.error) throw new Error(parsed.error)
    return parsed.text?.trim() ?? ''
  }
  // Unreachable: attempt=3 with status 503 falls through to the !response.ok
  // throw above. TypeScript requires a return/throw after the loop.
  throw new Error('Hugging Face HTTP 503: model unavailable after retries')
}

export async function transcribeWithProvider(
  wav: Buffer,
  settings: AwakenedVoiceSttSettings,
  language?: string,
): Promise<string> {
  switch (settings.provider) {
    case 'groq':
    case 'compatible':
      return transcribeGroqCompatible(wav, settings, language)
    case 'deepgram':
      return transcribeDeepgram(wav, settings, language)
    case 'huggingface':
      return transcribeHuggingFace(wav, settings)
    default: {
      const _exhaustive: never = settings.provider
      throw new Error(`Unknown STT provider: ${String(_exhaustive)}`)
    }
  }
}
