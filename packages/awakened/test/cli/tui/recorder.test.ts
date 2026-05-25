import { expect, test } from "bun:test"
import { parseWindowsAudioDevices, pickWindowsAudioDevice } from "../../../src/cli/cmd/tui/util/voice/recorder"

const SAMPLE_FFMPEG_LIST = `
[dshow @ 000001] DirectShow video devices
[dshow @ 000001] DirectShow audio devices
  "Stereo Mix (Realtek(R) Audio)" (audio)
  "Microphone Array (Intel® Smart Sound)" (audio)
  "CABLE Output (VB-Audio Virtual Cable)" (audio)
`

test("parseWindowsAudioDevices lists dshow capture names", () => {
  expect(parseWindowsAudioDevices(SAMPLE_FFMPEG_LIST)).toEqual([
    "Stereo Mix (Realtek(R) Audio)",
    "Microphone Array (Intel® Smart Sound)",
    "CABLE Output (VB-Audio Virtual Cable)",
  ])
})

test("pickWindowsAudioDevice prefers microphone over stereo mix", () => {
  const devices = parseWindowsAudioDevices(SAMPLE_FFMPEG_LIST)
  expect(pickWindowsAudioDevice(devices)).toBe("Microphone Array (Intel® Smart Sound)")
})
