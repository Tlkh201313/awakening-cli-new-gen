import { describe, expect, test } from "bun:test"
import { awakenedCapabilityMetadata, listAwakenedCapabilityBadges } from "../src/capability-display"

describe("capability-display", () => {
  test("lists unique capability badges from synthetic text parts", () => {
    const parts = [
      {
        type: "text",
        synthetic: true,
        metadata: awakenedCapabilityMetadata("awakened-design", "Awakened Design"),
      },
      {
        type: "text",
        synthetic: true,
        metadata: awakenedCapabilityMetadata("awakened-design", "Awakened Design"),
      },
      { type: "text", synthetic: false, text: "build a landing page" },
    ]

    expect(listAwakenedCapabilityBadges(parts)).toEqual([{ id: "awakened-design", label: "Awakened Design" }])
  })
})
