import { describe, expect, test } from "bun:test"
import { matchesAwakenedTasteCapability } from "../../../src/capabilities/triggers/taste"

describe("matchesAwakenedTasteCapability", () => {
  test("matches taste-skill and anti-slop phrases", () => {
    expect(matchesAwakenedTasteCapability("use taste-skill for this landing page")).toBe(true)
    expect(matchesAwakenedTasteCapability("awakened-taste — no generic AI slop")).toBe(true)
    expect(matchesAwakenedTasteCapability("make this dashboard look premium")).toBe(true)
  })

  test("does not match unrelated backend work", () => {
    expect(matchesAwakenedTasteCapability("fix the postgres migration")).toBe(false)
  })
})
