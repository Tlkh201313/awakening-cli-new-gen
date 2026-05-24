import { afterEach, describe, expect, test } from 'bun:test'
import {
  getVoiceSessionUiState,
  registerVoiceSessionHandlers,
  requestVoiceRecordingStart,
  requestVoiceRecordingStop,
  resetVoiceSessionControlForTests,
  setVoiceSessionUiState,
} from './voiceSessionControl.js'

afterEach(() => {
  resetVoiceSessionControlForTests()
})

describe('voiceSessionControl', () => {
  test('forwards start/stop to registered handlers', () => {
    let started = 0
    let stopped = 0
    const unregister = registerVoiceSessionHandlers({
      start: () => {
        started += 1
      },
      stop: () => {
        stopped += 1
      },
    })
    requestVoiceRecordingStart()
    requestVoiceRecordingStop()
    unregister()
    expect(started).toBe(1)
    expect(stopped).toBe(1)
  })

  test('tracks UI state for slash command', () => {
    setVoiceSessionUiState('recording')
    expect(getVoiceSessionUiState()).toBe('recording')
  })
})
