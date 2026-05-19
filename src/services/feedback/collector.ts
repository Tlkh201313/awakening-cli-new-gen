import type { FeedbackBundle } from './storage.js'
import { saveFeedback } from './storage.js'

export interface FeedbackContext {
  sessionId: string
  messages: unknown[]
  provider: string
  model: string
  toolCalls: number
  sessionDuration: number
  ttft?: number
  throughput?: number
}

export async function collectFeedback(
  message: string,
  context: FeedbackContext,
  options: { transcriptDepth?: 'current' | '24h' | '7d' } = {},
): Promise<string> {
  const bundle: FeedbackBundle = {
    sessionId: context.sessionId,
    timestamp: new Date().toISOString(),
    message,
    transcriptDepth: options.transcriptDepth || 'current',
    transcript: context.messages,
    metadata: {
      provider: context.provider,
      model: context.model,
      ttft: context.ttft,
      throughput: context.throughput,
      toolCalls: context.toolCalls,
      sessionDuration: context.sessionDuration,
    },
  }

  return saveFeedback(bundle)
}
