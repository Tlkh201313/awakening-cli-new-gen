import { describe, expect, test } from "bun:test"
import {
  getAwakenedTokenMode,
  nextAwakenedTokenMode,
  normalizeAwakenedTokenMode,
  resolveCapabilityLimits,
  shouldUseCompactDispatch,
} from "../../src/capabilities/tokenMode"
import { resolveAwakenedBootstrapAttachment, resetAwakenedBootstrap } from "../../src/capabilities/bootstrap"
import { resetSentAutoCapabilities, resolveAutoCapabilityAttachments } from "../../src/capabilities/autoCapabilities"

describe("tokenMode", () => {
  test("defaults to normal", () => {
    expect(getAwakenedTokenMode({})).toBe("normal")
    expect(normalizeAwakenedTokenMode(undefined)).toBe("normal")
  })

  test("cycles modes", () => {
    expect(nextAwakenedTokenMode("normal")).toBe("efficient")
    expect(nextAwakenedTokenMode("efficient")).toBe("caveman")
    expect(nextAwakenedTokenMode("caveman")).toBe("normal")
  })

  test("tightens capability limits by mode", () => {
    expect(resolveCapabilityLimits("normal")).toEqual({ maxPerTurn: 2, maxBootstrap: 6, skipBootstrap: false })
    expect(resolveCapabilityLimits("efficient")).toEqual({ maxPerTurn: 1, maxBootstrap: 2, skipBootstrap: false })
    expect(resolveCapabilityLimits("caveman")).toEqual({ maxPerTurn: 1, maxBootstrap: 1, skipBootstrap: true })
  })

  test("uses compact dispatch outside normal", () => {
    expect(shouldUseCompactDispatch("normal")).toBe(false)
    expect(shouldUseCompactDispatch("efficient")).toBe(true)
    expect(shouldUseCompactDispatch("caveman")).toBe(true)
  })

  test("skips verbose bootstrap in caveman mode", () => {
    resetAwakenedBootstrap("session-caveman")
    expect(
      resolveAwakenedBootstrapAttachment({
        sessionID: "session-caveman",
        agentMode: "primary",
        autoCapabilities: true,
        tokenMode: "caveman",
      }),
    ).toBeUndefined()
  })

  test("limits auto capability attachments in efficient mode", () => {
    resetSentAutoCapabilities("session-efficient")
    const attachments = resolveAutoCapabilityAttachments({
      userText: "review this PR, run tests, fix frontend UI, audit security, write docs",
      toolNames: ["task", "skill"],
      agentKey: "session-efficient",
      agentMode: "primary",
      autoCapabilities: true,
      tokenMode: "efficient",
    })
    expect(attachments.length).toBeLessThanOrEqual(2)
  })
})
