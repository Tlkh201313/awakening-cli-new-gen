import { appendTelemetry, type TelemetryEvent } from './storage.js'
import { METRIC_EVENTS } from './metrics.js'

let telemetryEnabled = false

export function setTelemetryEnabled(enabled: boolean): void {
  telemetryEnabled = enabled
}

export function isTelemetryEnabled(): boolean {
  return telemetryEnabled ||
    process.env.AWAKENED_TELEMETRY === '1' ||
    process.env.AWAKENED_TELEMETRY === 'true'
}

function record(event: TelemetryEvent): void {
  if (!isTelemetryEnabled()) return
  appendTelemetry({
    ...event,
    ts: new Date().toISOString(),
  }).catch(() => {
    // Telemetry is best-effort
  })
}

export function recordApiCall(data: {
  provider: string
  model: string
  ttft: number
  tokens: number
  cacheHit: number
  duration: number
}): void {
  record({ event: METRIC_EVENTS.API_CALL, ...data })
}

export function recordToolUse(data: {
  tool: string
  duration: number
  success: boolean
}): void {
  record({ event: METRIC_EVENTS.TOOL_USE, ...data })
}

export function recordError(data: {
  type: string
  provider: string
  retry: number
}): void {
  record({ event: METRIC_EVENTS.ERROR, ...data })
}

export function recordSessionStart(): void {
  record({ event: METRIC_EVENTS.SESSION_START })
}

export function recordSessionEnd(): void {
  record({ event: METRIC_EVENTS.SESSION_END })
}
