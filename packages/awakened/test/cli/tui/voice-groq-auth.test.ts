import { expect, test } from "bun:test"
import { resolveGroqApiKey } from "../../../src/cli/cmd/tui/util/voice/transcribe-groq"

test("resolveGroqApiKey prefers voice kv over env", () => {
  const prior = process.env.GROQ_API_KEY
  process.env.GROQ_API_KEY = "env-key"
  expect(resolveGroqApiKey("kv-key")).toBe("kv-key")
  if (prior === undefined) delete process.env.GROQ_API_KEY
  else process.env.GROQ_API_KEY = prior
})
