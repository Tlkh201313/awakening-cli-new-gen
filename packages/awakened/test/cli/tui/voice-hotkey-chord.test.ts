import { expect, test } from "bun:test"
import type { KeyEvent } from "@opentui/core"
import { parseVoiceChord, voiceToggleChordActive } from "../../../src/cli/cmd/tui/util/voice/voice-hotkey-chord"

test("parseVoiceChord parses ctrl+alt+v", () => {
  expect(parseVoiceChord("ctrl+alt+v")).toEqual({
    key: "v",
    ctrl: true,
    alt: true,
    shift: false,
    super: false,
  })
})

test("voiceToggleChordActive matches modifier chord", () => {
  const chords = [parseVoiceChord("ctrl+alt+v")!]
  expect(
    voiceToggleChordActive(
      { name: "v", ctrl: true, meta: true, shift: false, super: false, preventDefault() {}, stopPropagation() {} } as unknown as KeyEvent,
      chords,
    ),
  ).toBe(true)
  expect(
    voiceToggleChordActive(
      { name: "v", ctrl: true, meta: false, shift: false, super: false, preventDefault() {}, stopPropagation() {} } as unknown as KeyEvent,
      chords,
    ),
  ).toBe(false)
})
