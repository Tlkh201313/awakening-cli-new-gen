/**
 * Bridge between slash commands and the React voice hook (useVoice).
 * Lets /voice start/stop recording without hold-to-talk keybindings.
 */

export type VoiceSessionUiState = 'idle' | 'recording' | 'processing'

let uiState: VoiceSessionUiState = 'idle'
let handlers: { start: () => void; stop: () => void } | null = null

export function getVoiceSessionUiState(): VoiceSessionUiState {
  return uiState
}

export function setVoiceSessionUiState(state: VoiceSessionUiState): void {
  uiState = state
}

export function registerVoiceSessionHandlers(h: {
  start: () => void
  stop: () => void
}): () => void {
  handlers = h
  return () => {
    if (handlers === h) handlers = null
  }
}

export function requestVoiceRecordingStart(): void {
  handlers?.start()
}

export function requestVoiceRecordingStop(): void {
  handlers?.stop()
}

/** Test-only */
export function resetVoiceSessionControlForTests(): void {
  uiState = 'idle'
  handlers = null
}
