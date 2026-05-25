import { describe, expect, test } from "bun:test"
import { mkdtemp, writeFile, rm } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import * as PersonalityStore from "../../src/personality/store"
import { resolveActivePersonalityPrompt, getActivePersonalityId } from "../../src/personality"

describe("PersonalityStore", () => {
  test("lists builtin presets", async () => {
    const items = await PersonalityStore.list(process.cwd())
    expect(items.some((item) => item.id === "concise")).toBe(true)
    expect(items.some((item) => item.id === "default")).toBe(true)
  })

  test("saves and resolves custom personality", async () => {
    const dir = await mkdtemp(join(tmpdir(), "awakened-personality-"))
    try {
      await PersonalityStore.saveCustom({
        worktree: dir,
        id: "team-lead",
        name: "Team Lead",
        description: "Direct engineering lead tone",
        content: "Be direct. Prefer bullets. No fluff.",
      })
      const prompt = await PersonalityStore.resolvePrompt("team-lead", dir)
      expect(prompt).toContain("No fluff")
      const listed = await PersonalityStore.list(dir)
      expect(listed.some((item) => item.id === "team-lead" && item.source === "custom")).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  test("imports markdown file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "awakened-personality-import-"))
    const source = join(dir, "source.md")
    try {
      await writeFile(
        source,
        "---\nname: Imported\ndescription: From file\n---\n\nSpeak like a staff engineer.\n",
        "utf-8",
      )
      const saved = await PersonalityStore.importFile(dir, source)
      expect(saved.id).toBe("imported")
      const prompt = await PersonalityStore.resolvePrompt("imported", dir)
      expect(prompt).toContain("staff engineer")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe("getActivePersonalityId", () => {
  test("defaults when unset", () => {
    expect(getActivePersonalityId({})).toBe("default")
    expect(getActivePersonalityId({ awakenedPersonality: { active: null } })).toBe("default")
  })

  test("resolveActivePersonalityPrompt returns builtin text", async () => {
    const prompt = await resolveActivePersonalityPrompt({ awakenedPersonality: { active: "concise" } }, process.cwd())
    expect(prompt).toContain("ultra-concise")
  })
})
