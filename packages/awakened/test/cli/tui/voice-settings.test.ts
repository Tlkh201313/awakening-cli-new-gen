import { expect, test } from "bun:test"
import { nextVoiceModel, nextVoiceProvider } from "../../../src/cli/cmd/tui/util/voice/voice-settings"
import { voiceHotkeyLabel } from "../../../src/cli/cmd/tui/util/voice/voice-hotkey"
import { VOICE_MODELS } from "../../../src/cli/cmd/tui/util/voice/transcribe"

test("nextVoiceModel cycles through bundled models", () => {
  const ids = Object.keys(VOICE_MODELS)
  const first = ids[0] as keyof typeof VOICE_MODELS
  const second = nextVoiceModel(first)
  expect(ids).toContain(second)
  expect(second).not.toBe(first)
})

test("nextVoiceProvider toggles local and groq", () => {
  expect(nextVoiceProvider("local")).toBe("groq")
  expect(nextVoiceProvider("groq")).toBe("local")
})

test("voiceHotkeyLabel is platform-specific", () => {
  const label = voiceHotkeyLabel()
  if (process.platform === "darwin") expect(label).toContain("⌘")
  if (process.platform === "win32") expect(label).toBe("Ctrl+Alt+V")
})
