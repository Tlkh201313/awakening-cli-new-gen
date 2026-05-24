import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { pcm16ToWav } from '../services/awakenedVoiceSTT.js'

describe('pcm16ToWav', () => {
  test('produces valid RIFF header and payload length', () => {
    const pcm = Buffer.alloc(3200, 0)
    const wav = pcm16ToWav(pcm)
    expect(wav.slice(0, 4).toString()).toBe('RIFF')
    expect(wav.slice(8, 12).toString()).toBe('WAVE')
    expect(wav.length).toBe(44 + pcm.length)
    expect(wav.readUInt32LE(40)).toBe(pcm.length)
  })
})

describe('getAwakenedVoiceSttSettings', () => {
  const prevGroq = process.env.GROQ_API_KEY
  const prevOpenai = process.env.OPENAI_API_KEY
  const prevDg = process.env.DEEPGRAM_API_KEY

  beforeEach(() => {
    delete process.env.GROQ_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.DEEPGRAM_API_KEY
    delete process.env.AWAKENED_VOICE_STT_PROVIDER
  })

  afterEach(() => {
    if (prevGroq === undefined) delete process.env.GROQ_API_KEY
    else process.env.GROQ_API_KEY = prevGroq
    if (prevOpenai === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = prevOpenai
    if (prevDg === undefined) delete process.env.DEEPGRAM_API_KEY
    else process.env.DEEPGRAM_API_KEY = prevDg
  })

  test('resolves groq when GROQ_API_KEY set', async () => {
    process.env.GROQ_API_KEY = 'gsk_test'
    const { getAwakenedVoiceSttSettings } = await import('./awakenedVoiceConfig.js')
    const s = getAwakenedVoiceSttSettings()
    expect(s?.provider).toBe('groq')
    expect(s?.apiKey).toBe('gsk_test')
  })

  test('does not use OPENAI_API_KEY for STT', async () => {
    process.env.OPENAI_API_KEY = 'sk_test'
    const { getAwakenedVoiceSttSettings } = await import('./awakenedVoiceConfig.js')
    expect(getAwakenedVoiceSttSettings()).toBeNull()
  })

  test('prefers groq over deepgram when both set', async () => {
    process.env.GROQ_API_KEY = 'gsk_a'
    process.env.DEEPGRAM_API_KEY = 'dg_b'
    const { getAwakenedVoiceSttSettings } = await import('./awakenedVoiceConfig.js')
    expect(getAwakenedVoiceSttSettings()?.provider).toBe('groq')
  })
})
