/**
 * Batch speech-to-text for Awakened — free cloud providers (Groq / Deepgram / HF).
 * Implements the same connection shape as voice_stream for useVoice hold-to-talk.
 */
import { logForDebugging } from '../utils/debug.js'
import { toError } from '../utils/errors.js'
import { logError } from '../utils/log.js'
import { transcribeWithProvider } from './awakenedVoiceTranscribe.js'
import {
  getAwakenedVoiceSttSettings,
  isAwakenedVoiceSttConfigured,
} from '../voice/awakenedVoiceConfig.js'
import type {
  FinalizeSource,
  VoiceStreamCallbacks,
  VoiceStreamConnection,
} from './voiceStreamSTT.js'

const SAMPLE_RATE = 16_000
const CHANNELS = 1
const BITS_PER_SAMPLE = 16

/** PCM s16le mono → WAV for Whisper-compatible APIs. */
export function pcm16ToWav(
  pcm: Buffer,
  sampleRate = SAMPLE_RATE,
  channels = CHANNELS,
): Buffer {
  const byteRate = (sampleRate * channels * BITS_PER_SAMPLE) / 8
  const blockAlign = (channels * BITS_PER_SAMPLE) / 8
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(BITS_PER_SAMPLE, 34)
  header.write('data', 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

export function isAwakenedVoiceSttAvailable(): boolean {
  return isAwakenedVoiceSttConfigured()
}

async function transcribeWav(
  wav: Buffer,
  language?: string,
): Promise<string> {
  const settings = getAwakenedVoiceSttSettings()
  if (!settings) {
    throw new Error('Voice STT is not configured')
  }
  return transcribeWithProvider(wav, settings, language)
}

export function createAwakenedBatchVoiceConnection(
  callbacks: VoiceStreamCallbacks,
  options?: { language?: string },
): VoiceStreamConnection {
  const chunks: Buffer[] = []
  let ready = false
  let closed = false

  const conn: VoiceStreamConnection = {
    send(chunk: Buffer) {
      if (!closed) chunks.push(Buffer.from(chunk))
    },
    async finalize(): Promise<FinalizeSource> {
      const pcm = Buffer.concat(chunks)
      chunks.length = 0
      if (pcm.length < 1600) {
        logForDebugging('[awakened_voice] clip too short, skipping STT')
        return 'post_closestream_endpoint'
      }
      try {
        const wav = pcm16ToWav(pcm)
        const text = await transcribeWav(wav, options?.language)
        if (text) {
          callbacks.onTranscript(text, true)
        }
        return 'post_closestream_endpoint'
      } catch (err) {
        const message = toError(err).message
        logError(err)
        callbacks.onError(message, { fatal: false })
        return 'post_closestream_endpoint'
      }
    },
    close() {
      closed = true
      chunks.length = 0
      callbacks.onClose()
    },
    isConnected: () => ready && !closed,
  }

  queueMicrotask(() => {
    if (closed) return
    ready = true
    callbacks.onReady(conn)
  })

  return conn
}

export async function connectAwakenedVoiceStream(
  callbacks: VoiceStreamCallbacks,
  options?: { language?: string; keyterms?: string[] },
): Promise<VoiceStreamConnection | null> {
  void options?.keyterms
  if (!isAwakenedVoiceSttAvailable()) {
    logForDebugging('[awakened_voice] STT not configured')
    return null
  }
  return createAwakenedBatchVoiceConnection(callbacks, {
    language: options?.language,
  })
}
