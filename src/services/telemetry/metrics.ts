export const METRIC_EVENTS = {
  API_CALL: 'api_call',
  TOOL_USE: 'tool_use',
  ERROR: 'error',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  COMMAND: 'command',
} as const

export type MetricEvent = (typeof METRIC_EVENTS)[keyof typeof METRIC_EVENTS]

export interface ApiCallMetric {
  event: typeof METRIC_EVENTS.API_CALL
  provider: string
  model: string
  ttft: number
  tokens: number
  cacheHit: number
  duration: number
}

export interface ToolUseMetric {
  event: typeof METRIC_EVENTS.TOOL_USE
  tool: string
  duration: number
  success: boolean
}

export interface ErrorMetric {
  event: typeof METRIC_EVENTS.ERROR
  type: string
  provider: string
  retry: number
}
