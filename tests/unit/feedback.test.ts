import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtemp, rm, readFile, readdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

describe('feedback storage', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'feedback-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should save feedback as JSON file', async () => {
    const { saveFeedback } = await import('../../src/services/feedback/storage.js')
    const feedback = {
      sessionId: 'test-session-123',
      timestamp: new Date().toISOString(),
      message: 'Great experience!',
      transcriptDepth: 'current' as const,
      transcript: [],
      metadata: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        toolCalls: 5,
        sessionDuration: 120,
      },
    }

    const filePath = await saveFeedback(feedback, tempDir)
    const content = JSON.parse(await readFile(filePath, 'utf-8'))
    expect(content.message).toBe('Great experience!')
    expect(content.sessionId).toBe('test-session-123')
  })

  it('should list feedback files', async () => {
    const { saveFeedback, listFeedback } = await import('../../src/services/feedback/storage.js')
    await saveFeedback({
      sessionId: 's1',
      timestamp: new Date().toISOString(),
      message: 'feedback 1',
      transcriptDepth: 'current',
      transcript: [],
      metadata: { provider: 'anthropic', model: 'test', toolCalls: 0, sessionDuration: 0 },
    }, tempDir)
    await saveFeedback({
      sessionId: 's2',
      timestamp: new Date().toISOString(),
      message: 'feedback 2',
      transcriptDepth: 'current',
      transcript: [],
      metadata: { provider: 'anthropic', model: 'test', toolCalls: 0, sessionDuration: 0 },
    }, tempDir)

    const files = await listFeedback(tempDir)
    expect(files.length).toBe(2)
  })
})
