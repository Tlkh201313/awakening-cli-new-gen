import { afterEach, describe, expect, test } from "bun:test"
import {
  autoSaveFromTurn,
  autoSaveFromUser,
  extractUserRemember,
  formatRecallInjection,
  getMemoryAutoConfig,
  recallForPrompt,
} from "../../src/memory/auto"
import * as MemoryStore from "../../src/memory/store"
import path from "path"
import { mkdir, rm } from "fs/promises"
import { Global } from "@awakened-ai/core/global"

const memoryDir = path.join(Global.Path.data, "memory")
const cfg = getMemoryAutoConfig({})

afterEach(async () => {
  await rm(memoryDir, { recursive: true, force: true })
})

describe("memory auto", () => {
  test("defaults auto-save and auto-recall on", () => {
    expect(getMemoryAutoConfig({}).autoSave).toBe(true)
    expect(getMemoryAutoConfig({}).autoRecall).toBe(true)
    expect(getMemoryAutoConfig({ awakenedMemory: { autoSave: false } }).autoSave).toBe(false)
  })

  test("extracts remember-this phrases", () => {
    expect(extractUserRemember("remember this: always run bun typecheck from packages/awakened")?.content).toContain(
      "bun typecheck",
    )
    expect(extractUserRemember("my preference is dark themes")?.title).toContain("dark themes")
  })

  test("auto-saves user preference text", async () => {
    const worktree = path.join(Global.Path.tmp, `memory-auto-${crypto.randomUUID()}`)
    await mkdir(path.join(worktree, ".awakened", "memory"), { recursive: true })

    const entry = await autoSaveFromUser("remember this: use keep-alive fetch for providers", worktree, cfg)
    expect(entry?.tags).toContain("auto")
    expect(entry?.content).toContain("keep-alive")

    await rm(worktree, { recursive: true, force: true })
  })

  test("skips duplicate auto-save", async () => {
    const worktree = path.join(Global.Path.tmp, `memory-dup-${crypto.randomUUID()}`)
    await mkdir(path.join(worktree, ".awakened", "memory"), { recursive: true })

    const first = await autoSaveFromUser("remember this: duplicate test value", worktree, cfg)
    const second = await autoSaveFromUser("remember this: duplicate test value", worktree, cfg)
    expect(first?.id).toBeDefined()
    expect(second).toBeUndefined()

    await rm(worktree, { recursive: true, force: true })
  })

  test("auto-recalls matching entries", async () => {
    const worktree = path.join(Global.Path.tmp, `memory-recall-${crypto.randomUUID()}`)
    await mkdir(path.join(worktree, ".awakened", "memory"), { recursive: true })

    await MemoryStore.save({
      title: "Auth middleware",
      content: "Token expiry uses <= not < in auth middleware.",
      worktree,
    })

    const hits = await recallForPrompt("fix auth middleware token expiry", worktree, cfg)
    expect(hits.some((hit) => hit.title === "Auth middleware")).toBe(true)
    expect(formatRecallInjection(hits)).toContain("auto-recalled")

    await rm(worktree, { recursive: true, force: true })
  })

  test("auto-saves assistant summary without tools when durable", async () => {
    const worktree = path.join(Global.Path.tmp, `memory-assist-${crypto.randomUUID()}`)
    await mkdir(path.join(worktree, ".awakened", "memory"), { recursive: true })

    const entry = await autoSaveFromTurn({
      userText: "why did auth fail?",
      assistantText:
        "Root cause: token expiry used <= not < in packages/awakened/src/auth/middleware.ts. Fixed comparison.",
      toolNames: [],
      worktree,
      cfg,
    })

    expect(entry?.tags).toContain("discovery")
    expect(entry?.content).toContain("Root cause")

    await rm(worktree, { recursive: true, force: true })
  })

  test("auto-saves turn summary after significant tools", async () => {
    const worktree = path.join(Global.Path.tmp, `memory-turn-${crypto.randomUUID()}`)
    await mkdir(path.join(worktree, ".awakened", "memory"), { recursive: true })

    const entry = await autoSaveFromTurn({
      userText: "fix the sidebar crash",
      assistantText: "Fixed invalid text nesting in awakened sidebar by splitting TokenModeBadge into its own row.",
      toolNames: ["edit", "read"],
      worktree,
      cfg,
    })

    expect(entry?.tags).toContain("turn")
    expect(entry?.content).toContain("edit")

    await rm(worktree, { recursive: true, force: true })
  })
})
