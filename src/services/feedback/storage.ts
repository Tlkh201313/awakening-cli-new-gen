import { mkdir, writeFile, readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

export interface FeedbackBundle {
  sessionId: string
  timestamp: string
  message: string
  transcriptDepth: 'current' | '24h' | '7d'
  transcript: unknown[]
  metadata: {
    provider: string
    model: string
    ttft?: number
    throughput?: number
    toolCalls: number
    sessionDuration: number
  }
}

function getFeedbackDir(): string {
  return join(homedir(), '.awakened', 'feedback')
}

export async function saveFeedback(
  feedback: FeedbackBundle,
  dir?: string,
): Promise<string> {
  const feedbackDir = dir || getFeedbackDir()
  await mkdir(feedbackDir, { recursive: true })

  const filename = `${feedback.sessionId}-${Date.now()}.json`
  const filePath = join(feedbackDir, filename)
  await writeFile(filePath, JSON.stringify(feedback, null, 2))
  return filePath
}

export async function listFeedback(dir?: string): Promise<string[]> {
  const feedbackDir = dir || getFeedbackDir()
  try {
    const files = await readdir(feedbackDir)
    return files.filter(f => f.endsWith('.json')).map(f => join(feedbackDir, f))
  } catch {
    return []
  }
}

export async function readFeedback(filePath: string): Promise<FeedbackBundle> {
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content) as FeedbackBundle
}
