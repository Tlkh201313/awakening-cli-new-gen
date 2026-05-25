import { afterEach, expect, test } from "bun:test"
import path from "path"
import { mkdir, rm } from "fs/promises"
import { Global } from "@awakened-ai/core/global"
import * as MemoryStore from "../../src/memory/store"

const memoryDir = path.join(Global.Path.data, "memory")

afterEach(async () => {
  await rm(memoryDir, { recursive: true, force: true })
})

test("awakened-memory saves and searches project-scoped entries", async () => {
  const worktree = path.join(Global.Path.tmp, `memory-test-${crypto.randomUUID()}`)
  await mkdir(path.join(worktree, ".awakened", "memory"), { recursive: true })

  await MemoryStore.save({
    title: "Use bun typecheck",
    content: "Run bun typecheck from packages/awakened, never tsc at repo root.",
    tags: ["testing", "typescript"],
    scope: "project",
    worktree,
  })

  const hits = await MemoryStore.search({
    query: "typecheck packages",
    worktree,
    scope: "project",
  })

  expect(hits.length).toBe(1)
  expect(hits[0]?.title).toBe("Use bun typecheck")
  expect(MemoryStore.formatEntries(hits)).toContain("bun typecheck")
})

test("awakened-memory stores global entries separately", async () => {
  const worktree = path.join(Global.Path.tmp, `memory-test-${crypto.randomUUID()}`)
  await mkdir(worktree, { recursive: true })

  await MemoryStore.save({
    title: "Prefer dark mode",
    content: "User prefers dark themes in the TUI.",
    scope: "global",
    worktree,
  })

  const hits = await MemoryStore.search({
    query: "dark mode",
    worktree,
    scope: "global",
  })

  expect(hits.length).toBe(1)
  expect(hits[0]?.scope).toBe("global")
})

test("awakened-memory saveUnique skips duplicates", async () => {
  const worktree = path.join(Global.Path.tmp, `memory-dup-${crypto.randomUUID()}`)
  await mkdir(path.join(worktree, ".awakened", "memory"), { recursive: true })

  const first = await MemoryStore.saveUnique({
    title: "Dup test",
    content: "Same content",
    worktree,
  })
  const second = await MemoryStore.saveUnique({
    title: "Dup test",
    content: "Same content",
    worktree,
  })
  expect(first?.id).toBeDefined()
  expect(second).toBeUndefined()

  await rm(worktree, { recursive: true, force: true })
})
