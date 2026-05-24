/**
 * Routes hold-to-talk STT to Anthropic voice_stream (OAuth) or Awakened batch Whisper.
 */
import { isAwakenedVoiceSttAvailable } from './awakenedVoiceSTT.js'
import {
  connectVoiceStream,
  isVoiceStreamAvailable,
  type VoiceStreamCallbacks,
  type VoiceStreamConnection,
} from './voiceStreamSTT.js'

export function isAnyVoiceSttAvailable(): boolean {
  return isVoiceStreamAvailable() || isAwakenedVoiceSttAvailable()
}

export async function connectSpeechToText(
  callbacks: VoiceStreamCallbacks,
  options?: { language?: string; keyterms?: string[] },
): Promise<VoiceStreamConnection | null> {
  if (isVoiceStreamAvailable()) {
    return connectVoiceStream(callbacks, options)
  }
  if (isAwakenedVoiceSttAvailable()) {
    const { connectAwakenedVoiceStream } = await import('./awakenedVoiceSTT.js')
    return connectAwakenedVoiceStream(callbacks, options)
  }
  return null
}
