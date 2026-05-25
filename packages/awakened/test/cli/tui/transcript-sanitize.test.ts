import { expect, test } from "bun:test"
import { isVoiceHallucinationPhrase, sanitizeVoiceTranscript } from "../../../src/cli/cmd/tui/util/voice/transcript-sanitize"

test("sanitizeVoiceTranscript drops repeated you hallucination", () => {
  expect(sanitizeVoiceTranscript("you you you")).toBe("")
  expect(sanitizeVoiceTranscript("You You")).toBe("")
})

test("sanitizeVoiceTranscript drops thank you hallucination", () => {
  expect(sanitizeVoiceTranscript("Thank you. Thank you.")).toBe("")
  expect(sanitizeVoiceTranscript("Thank you.")).toBe("")
  expect(isVoiceHallucinationPhrase("Thank you")).toBe(true)
})

test("sanitizeVoiceTranscript keeps real speech", () => {
  expect(sanitizeVoiceTranscript("hello")).toBe("hello")
  expect(sanitizeVoiceTranscript("hello world")).toBe("hello world")
  expect(sanitizeVoiceTranscript("add a login page")).toBe("add a login page")
})

test("sanitizeVoiceTranscript dedupes identical sentences", () => {
  expect(sanitizeVoiceTranscript("Hello there. Hello there.")).toBe("Hello there.")
})

test("sanitizeVoiceTranscript drops i don't know hallucination", () => {
  expect(sanitizeVoiceTranscript("I don't know.")).toBe("")
  expect(sanitizeVoiceTranscript("I don't know")).toBe("")
  expect(isVoiceHallucinationPhrase("I don't know.")).toBe(true)
})

test("sanitizeVoiceTranscript keeps hello", () => {
  expect(sanitizeVoiceTranscript("Hello.")).toBe("Hello.")
  expect(sanitizeVoiceTranscript("Hello")).toBe("Hello")
})
