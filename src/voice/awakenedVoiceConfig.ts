/**
 * Built-in speech-to-text for Awakened — free-tier cloud providers (no OpenAI default).
 */
import { awakenedEnv } from '../constants/brand.js'
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
import { isEnvTruthy } from '../utils/envUtils.js'

/**
 * Awakened default: /voice to start, Enter (or /voice again) to finish → prompt.
 * Set AWAKENED_VOICE_HOLD_SPACE=1 to restore hold-Space push-to-talk.
 */
export function isAwakenedCommandVoiceUx(): boolean {
  return !isEnvTruthy(process.env.AWAKENED_VOICE_HOLD_SPACE)
}

/** Free / generous cloud STT backends (signup + API key required). */
export type AwakenedVoiceSttProvider =
  | 'groq'
  | 'deepgram'
  | 'huggingface'
  | 'compatible'

export type AwakenedVoiceSttSettings = {
  provider: AwakenedVoiceSttProvider
  apiKey: string
  baseUrl: string
  model: string
}

export const DEFAULT_VOICE_MODELS: Record<AwakenedVoiceSttProvider, string> = {
  groq: 'whisper-large-v3-turbo',
  deepgram: 'nova-2',
  huggingface: 'openai/whisper-large-v3-turbo',
  compatible: 'whisper-large-v3-turbo',
}

export const DEFAULT_VOICE_BASE_URLS: Record<AwakenedVoiceSttProvider, string> = {
  groq: 'https://api.groq.com/openai/v1',
  deepgram: 'https://api.deepgram.com/v1',
  huggingface: 'https://api-inference.huggingface.co',
  compatible: 'https://api.groq.com/openai/v1',
}

export const FREE_STT_SIGNUP_HINTS: Record<
  Exclude<AwakenedVoiceSttProvider, 'compatible'>,
  { name: string; url: string; envKey: string }
> = {
  groq: {
    name: 'Groq (free tier)',
    url: 'https://console.groq.com/keys',
    envKey: 'GROQ_API_KEY',
  },
  deepgram: {
    name: 'Deepgram ($200 free credit)',
    url: 'https://console.deepgram.com/signup',
    envKey: 'DEEPGRAM_API_KEY',
  },
  huggingface: {
    name: 'Hugging Face Inference (free tier)',
    url: 'https://huggingface.co/settings/tokens',
    envKey: 'HF_TOKEN',
  },
}

function parseProvider(raw: string | undefined): AwakenedVoiceSttProvider | null {
  if (!raw) return null
  const p = raw.toLowerCase().trim()
  if (p === 'groq') return 'groq'
  if (p === 'deepgram' || p === 'dg') return 'deepgram'
  if (p === 'huggingface' || p === 'hf') return 'huggingface'
  if (
    p === 'compatible' ||
    p === 'openai-compatible' ||
    p === 'custom' ||
    p === 'openai'
  ) {
    return 'compatible'
  }
  return null
}

function envOrConfig(
  envKey: string,
  configValue: string | undefined,
): string | undefined {
  const fromEnv = awakenedEnv(envKey) ?? process.env[envKey]
  if (fromEnv?.trim()) return fromEnv.trim()
  return configValue?.trim() || undefined
}

function inferProviderFromEnv(): AwakenedVoiceSttProvider | null {
  if (process.env.GROQ_API_KEY?.trim()) return 'groq'
  if (process.env.DEEPGRAM_API_KEY?.trim()) return 'deepgram'
  if (
    process.env.HF_TOKEN?.trim() ||
    process.env.HUGGINGFACE_HUB_TOKEN?.trim()
  ) {
    return 'huggingface'
  }
  return null
}

function apiKeyForProvider(provider: AwakenedVoiceSttProvider): string | undefined {
  const cfg = getGlobalConfig().voiceStt
  const fromConfig = envOrConfig('VOICE_STT_API_KEY', cfg?.apiKey)
  if (fromConfig) return fromConfig

  switch (provider) {
    case 'groq':
      return process.env.GROQ_API_KEY?.trim()
    case 'deepgram':
      return process.env.DEEPGRAM_API_KEY?.trim()
    case 'huggingface':
      return (
        process.env.HF_TOKEN?.trim() ??
        process.env.HUGGINGFACE_HUB_TOKEN?.trim()
      )
    case 'compatible':
      return (
        process.env.GROQ_API_KEY?.trim() ??
        process.env.DEEPGRAM_API_KEY?.trim() ??
        process.env.HF_TOKEN?.trim()
      )
  }
}

export function getAwakenedVoiceSttSettings(): AwakenedVoiceSttSettings | null {
  const cfg = getGlobalConfig().voiceStt
  const provider =
    parseProvider(envOrConfig('VOICE_STT_PROVIDER', cfg?.provider)) ??
    inferProviderFromEnv()
  if (!provider) return null

  const apiKey = apiKeyForProvider(provider)
  if (!apiKey) return null

  const baseUrl =
    envOrConfig('VOICE_STT_BASE_URL', cfg?.baseUrl) ??
    DEFAULT_VOICE_BASE_URLS[provider]
  const model =
    envOrConfig('VOICE_STT_MODEL', cfg?.model) ?? DEFAULT_VOICE_MODELS[provider]

  return { provider, apiKey, baseUrl: baseUrl.replace(/\/$/, ''), model }
}

export function isAwakenedVoiceSttConfigured(): boolean {
  return getAwakenedVoiceSttSettings() !== null
}

export function isVoiceEnableOnStartup(): boolean {
  if (awakenedEnv('VOICE_ON_STARTUP') === '1') return true
  if (awakenedEnv('VOICE_ON_STARTUP') === '0') return false
  return getGlobalConfig().voiceEnableOnStartup === true
}

export function setVoiceEnableOnStartup(enabled: boolean): void {
  saveGlobalConfig(prev => ({ ...prev, voiceEnableOnStartup: enabled }))
}

export function updateAwakenedVoiceSttConfig(patch: {
  provider?: AwakenedVoiceSttProvider
  apiKey?: string
  baseUrl?: string
  model?: string
}): void {
  saveGlobalConfig(prev => ({
    ...prev,
    voiceStt: { ...prev.voiceStt, ...patch },
  }))
}

export function saveVoiceSttSettings(input: {
  provider: AwakenedVoiceSttProvider
  apiKey: string
  model?: string
  baseUrl?: string
  enableOnStartup?: boolean
}): void {
  const apiKey = input.apiKey.trim()
  const model =
    input.model?.trim() || DEFAULT_VOICE_MODELS[input.provider]
  const baseUrl = (
    input.baseUrl?.trim() || DEFAULT_VOICE_BASE_URLS[input.provider]
  ).replace(/\/$/, '')

  saveGlobalConfig(prev => ({
    ...prev,
    voiceSetupDismissed: false,
    voiceSetupComplete: true,
    voiceEnableOnStartup:
      input.enableOnStartup === true
        ? true
        : input.enableOnStartup === false
          ? false
          : prev.voiceEnableOnStartup,
    voiceStt: {
      provider: input.provider,
      apiKey,
      model,
      baseUrl,
    },
  }))
}

export function dismissVoiceSetup(): void {
  saveGlobalConfig(prev => ({ ...prev, voiceSetupDismissed: true }))
}

export function shouldShowVoiceSetupAtStartup(): boolean {
  if (isAwakenedVoiceSttConfigured()) return false
  return getGlobalConfig().voiceSetupDismissed !== true
}
