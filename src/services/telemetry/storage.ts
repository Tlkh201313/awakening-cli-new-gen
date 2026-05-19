import { appendFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

export interface TelemetryEvent {
  ts: string
  event: string
  [key: string]: unknown
}

function getTelemetryDir(): string {
  return join(homedir(), '.awakened', 'telemetry')
}

function getDailyFile(dir?: string): string {
  const telemetryDir = dir || getTelemetryDir()
  const today = new Date().toISOString().split('T')[0]!
  return join(telemetryDir, `${today}.jsonl`)
}

export async function appendTelemetry(
  event: TelemetryEvent,
  dir?: string,
): Promise<void> {
  const telemetryDir = dir || getTelemetryDir()
  await mkdir(telemetryDir, { recursive: true })

  const filePath = getDailyFile(dir)
  const line = JSON.stringify(event) + '\n'
  await appendFile(filePath, line, 'utf-8')
}
