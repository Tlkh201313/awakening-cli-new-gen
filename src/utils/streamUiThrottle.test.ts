import { afterEach, describe, expect, test } from 'bun:test'
import {
  flushStreamUiThrottleState,
  resetStreamUiThrottleState,
  scheduleStreamingTextUiUpdate,
} from './streamUiThrottle.js'

afterEach(() => {
  resetStreamUiThrottleState()
  delete process.env.CLAUDE_CODE_STREAM_UI_FLUSH_MS
})

describe('streamUiThrottle', () => {
  test('coalesces rapid schedules into one flush', async () => {
    let runs = 0
    scheduleStreamingTextUiUpdate(() => {
      runs++
    })
    scheduleStreamingTextUiUpdate(() => {
      runs++
    })
    expect(runs).toBe(1)
    await new Promise(r => setTimeout(r, 60))
    expect(runs).toBe(2)
  })

  test('first text schedule runs immediately without waiting for flush interval', () => {
    let runs = 0
    scheduleStreamingTextUiUpdate(() => {
      runs++
    })
    expect(runs).toBe(1)
  })

  test('flushStreamUiThrottleState runs pending work immediately', () => {
    let runs = 0
    scheduleStreamingTextUiUpdate(() => {
      runs++
    })
    flushStreamUiThrottleState()
    expect(runs).toBe(1)
  })
})
