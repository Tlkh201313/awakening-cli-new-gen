import { describe, expect, test } from "bun:test"
import { AWAKENED_CAPABILITY_IDS } from "../../src/capabilities/ids"
import { resetAwakenedBootstrap, resolveAwakenedBootstrapAttachment } from "../../src/capabilities/bootstrap"

describe("resolveAwakenedBootstrapAttachment", () => {
  test("injects bootstrap once for primary agents", () => {
    resetAwakenedBootstrap()
    const first = resolveAwakenedBootstrapAttachment({
      sessionID: "ses_test",
      agentMode: "primary",
      autoCapabilities: true,
      disabled: [],
    })
    expect(first?.skillName).toBe("Awakened Auto")
    expect(first?.content).toContain("awakened-subagents")

    const second = resolveAwakenedBootstrapAttachment({
      sessionID: "ses_test",
      agentMode: "primary",
      autoCapabilities: true,
      disabled: [],
    })
    expect(second).toBeUndefined()
  })

  test("respects disabled packs in bootstrap content", () => {
    resetAwakenedBootstrap()
    const attachment = resolveAwakenedBootstrapAttachment({
      sessionID: "ses_disabled",
      agentMode: "primary",
      autoCapabilities: true,
      disabled: [AWAKENED_CAPABILITY_IDS.marketing],
    })
    expect(attachment?.content).not.toContain("Awakened Marketing")
  })
})
