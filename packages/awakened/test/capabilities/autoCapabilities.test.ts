import { describe, expect, test } from "bun:test"
import { Effect, Layer } from "effect"
import { AWAKENED_CAPABILITY_IDS } from "../../src/capabilities/ids"
import {
  getAutoCapabilityAttachments,
  getSentAutoCapabilities,
  resetSentAutoCapabilities,
  resolveAutoCapabilityAttachments,
} from "../../src/capabilities/autoCapabilities"
import { setTestDisabledAwakenedCapabilities } from "../../src/capabilities/settings"
import { Config } from "../../src/config/config"
import { testEffect } from "../lib/effect"

const it = testEffect(Layer.mergeAll(Config.defaultLayer))

describe("getAutoCapabilityAttachments", () => {
  it.effect("surfaces Awakened Browser for URL in user text", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "open https://example.com and click login",
        toolNames: ["webfetch"],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Browser")).toBe(true)
    }))

  it.effect("surfaces Awakened Research for training keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "help me fine-tune with LoRA and evaluate on a benchmark",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Research")).toBe(true)
    }))

  it.effect("surfaces Awakened Marketing for GTM keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "run a cold email outbound experiment for our ICP",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Marketing")).toBe(true)
    }))

  it.effect("surfaces Awakened Skills Vault for antigravity mention", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "install npx antigravity-awesome-skills and use @brainstorming",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Skills Vault")).toBe(true)
    }))

  it.effect("surfaces Awakened Graphify for graphify keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "run /graphify on this massive codebase to reduce tokens",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Graphify")).toBe(true)
    }))

  it.effect("surfaces Awakened Productivity for voltagent keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "browse awesome-agent-skills on officialskills.sh for stripe skill",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Productivity")).toBe(true)
    }))

  it.effect("surfaces Cursor catalog for skills.sh keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "install from skills.sh using npx skills add",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Cursor Skills Directory")).toBe(true)
    }))

  it.effect("surfaces Anthropic catalog for anthropics/skills keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "use anthropics/skills official anthropic skill for pptx",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Anthropic Official Skills")).toBe(true)
    }))

  it.effect("respects disabled setting", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([AWAKENED_CAPABILITY_IDS.marketing])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "SEO landing page CRO audit",
        toolNames: [],
      })
      expect(attachments).toHaveLength(0)
    }))

  it.effect("auto-surfaces Awakened Subagents for primary agents without keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "fix the login bug in auth.ts",
        toolNames: ["task", "read", "grep"],
        agentMode: "primary",
        autoSubagents: true,
        autoCapabilities: true,
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Subagents")).toBe(true)
    }))

  it.effect("bootstrap turn surfaces multiple capability packs", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "implement auth and write tests",
        toolNames: ["task", "skill", "read"],
        agentMode: "primary",
        autoCapabilities: true,
      })
      expect(attachments.length).toBeGreaterThan(2)
    }))

  it.effect("does not auto-surface Awakened Subagents when autoSubagents is disabled", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "fix the login bug in auth.ts",
        toolNames: ["task", "read", "grep"],
        agentMode: "primary",
        autoSubagents: false,
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Subagents")).toBe(false)
    }))

  it.effect("surfaces Awakened Subagents for orchestration keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "orchestrate subagents for this feature",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Subagents")).toBe(true)
    }))

  it.effect("surfaces Awakened Superpowers for TDD keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "use test-driven development and superpowers before building this feature",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Superpowers")).toBe(true)
    }))

  it.effect("surfaces Awakened Security for audit keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "run a security audit with OWASP checklist and threat model",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Security")).toBe(true)
    }))

  it.effect("surfaces Awakened DevTools for deploy keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "deploy to vercel and set up stripe webhook billing",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened DevTools")).toBe(true)
    }))

  it.effect("surfaces Awakened Testing for playwright keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "write playwright e2e tests for the login flow",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Testing")).toBe(true)
    }))

  it.effect("surfaces Awakened Code Review for PR keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "code review this PR before merge",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Code Review")).toBe(true)
    }))

  it.effect("surfaces Awakened AWS for lambda keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "deploy a lambda function with dynamodb",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened AWS")).toBe(true)
    }))

  it.effect("surfaces Awakened Frontend for react keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "build a next.js component with tailwind",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Frontend")).toBe(true)
    }))

  it.effect("surfaces Awakened Design for static html website requests", () =>
    Effect.sync(() => {
      resetSentAutoCapabilities()
      const attachments = resolveAutoCapabilityAttachments({
        userText: "make html website in Downloads folder with only 1 html file",
        toolNames: [],
        disabled: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Design")).toBe(true)
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Frontend")).toBe(false)
    }))

  it.effect("surfaces Awakened Design for awakened branding requests", () =>
    Effect.sync(() => {
      resetSentAutoCapabilities()
      const attachments = resolveAutoCapabilityAttachments({
        userText: "build the page using awakened design and v2 tokens",
        toolNames: [],
        disabled: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Design")).toBe(true)
    }))

  it.effect("surfaces Awakened Design for ui polish keywords", () =>
    Effect.sync(() => {
      resetSentAutoCapabilities()
      const attachments = resolveAutoCapabilityAttachments({
        userText: "polish the ui and improve accessibility with wcag checks",
        toolNames: [],
        disabled: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Design")).toBe(true)
    }))

  it.effect("surfaces Awakened Simplify for refactor keywords", () =>
    Effect.gen(function* () {
      resetSentAutoCapabilities()
      setTestDisabledAwakenedCapabilities([])
      const attachments = yield* getAutoCapabilityAttachments({
        userText: "simplify this over-engineered module and remove dead code",
        toolNames: [],
      })
      expect(attachments.some((attachment) => attachment.skillName === "Awakened Simplify")).toBe(true)
    }))

  test("does not resurface same capability in one session", () => {
    resetSentAutoCapabilities()
    resolveAutoCapabilityAttachments({
      userText: "SEO landing page CRO audit",
      toolNames: [],
      disabled: [],
    })
    const second = resolveAutoCapabilityAttachments({
      userText: "another marketing funnel question",
      toolNames: [],
      disabled: [],
    })
    expect(second).toHaveLength(0)
    expect(getSentAutoCapabilities().has(AWAKENED_CAPABILITY_IDS.marketing)).toBe(true)
  })
})
