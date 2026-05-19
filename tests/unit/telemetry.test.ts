import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtemp, rm, readFile, readdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

describe('telemetry storage', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'telemetry-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should append telemetry event to daily file', async () => {
    const { appendTelemetry } = await import('../../src/services/telemetry/storage.js')
    await appendTelemetry({
      ts: new Date().toISOString(),
      event: 'api_call',
      provider: 'anthropic',
      ttft: 150,
    }, tempDir)

    const files = await readdir(tempDir)
    expect(files.length).toBe(1)
    expect(files[0]!).toMatch(/^\d{4}-\d{2}-\d{2}\.jsonl$/)

    const content = await readFile(join(tempDir, files[0]!), 'utf-8')
    const lines = content.trim().split('\n')
    expect(lines.length).toBe(1)
    const event = JSON.parse(lines[0]!)
    expect(event.event).toBe('api_call')
  })

  it('should append multiple events to same file', async () => {
    const { appendTelemetry } = await import('../../src/services/telemetry/storage.js')
    await appendTelemetry({ ts: new Date().toISOString(), event: 'a' }, tempDir)
    await appendTelemetry({ ts: new Date().toISOString(), event: 'b' }, tempDir)

    const files = await readdir(tempDir)
    const content = await readFile(join(tempDir, files[0]!), 'utf-8')
    const lines = content.trim().split('\n')
    expect(lines.length).toBe(2)
  })
})
