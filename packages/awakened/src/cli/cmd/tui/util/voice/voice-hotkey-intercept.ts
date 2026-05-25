import type { TuiPluginApi } from "@awakened-ai/plugin/tui"
import { startVoiceHold, stopVoiceHold, voiceSnapshot } from "./controller"
import { readVoiceSettings } from "./voice-settings"
import { voiceChordsFromBindings, voiceToggleChordActive } from "./voice-hotkey-chord"

const HOTKEY_INTERCEPT_PRIORITY = 4_500
const STOP_GUARD_MS = 550
/** Key-repeat while holding the chord is ~30–80ms apart; require a gap before “press again to stop”. */
const STOP_CHORD_GAP_MS = 250

let lastVoiceChordMs = 0

/** Chord tap via intercept — OpenTUI cannot bind release on ctrl+alt+v chords. */
export function registerVoiceHotkeyIntercept(api: TuiPluginApi) {
  const chords = () => voiceChordsFromBindings(api.tuiConfig.keybinds.get("voice.toggle"))

  return api.keymap.intercept(
    "key",
    ({ event }) => {
      if (!readVoiceSettings(api.kv).hotkeyEnabled) return
      if (!readVoiceSettings(api.kv).enabled) return
      if (!voiceToggleChordActive(event, chords())) return

      event.preventDefault()
      event.stopPropagation()

      const now = Date.now()
      const gap = now - lastVoiceChordMs
      lastVoiceChordMs = now

      const snap = voiceSnapshot()
      if (snap.status === "idle") {
        lastVoiceChordMs = now
        void startVoiceHold(api)
        return
      }
      if (
        snap.status === "recording" &&
        snap.elapsedMs >= STOP_GUARD_MS &&
        gap >= STOP_CHORD_GAP_MS
      ) {
        lastVoiceChordMs = 0
        void stopVoiceHold(api)
      }
    },
    { priority: HOTKEY_INTERCEPT_PRIORITY },
  )
}

export function voiceHotkeyInterceptHint() {
  if (process.platform === "win32") {
    return "Press Ctrl+Alt+V to start, release, then press again to send (or Enter)"
  }
  return "Press voice hotkey to start, release, press again to send (or Enter)"
}
