export * as PersonalityStore from "./store"

import path from "path"
import { unlink } from "fs/promises"
import { Glob } from "@awakened-ai/core/util/glob"
import { ConfigMarkdown } from "@/config/markdown"
import { Filesystem } from "@/util/filesystem"
import { BUILTIN_PERSONALITIES, getBuiltinPersonality } from "./presets"

export type PersonalityEntry = {
  id: string
  name: string
  description: string
  source: "builtin" | "custom"
  path?: string
}

function personalitiesDir(worktree: string) {
  return path.join(worktree, ".awakened", "personalities")
}

function personalityPath(worktree: string, id: string) {
  return path.join(personalitiesDir(worktree), `${id}.md`)
}

function sanitizeId(raw: string) {
  const id = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return id || "custom"
}

export async function list(worktree: string): Promise<PersonalityEntry[]> {
  const builtin: PersonalityEntry[] = BUILTIN_PERSONALITIES.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    source: "builtin",
  }))

  const custom: PersonalityEntry[] = []
  const dir = personalitiesDir(worktree)
  if (await Filesystem.exists(dir)) {
    for (const file of await Glob.scan("*.md", {
      cwd: dir,
      absolute: true,
      dot: true,
    })) {
    const md = await ConfigMarkdown.parse(file).catch(() => undefined)
    if (!md) continue
    const id = sanitizeId(path.basename(file, ".md"))
    custom.push({
      id,
      name: typeof md.data.name === "string" ? md.data.name : id,
      description: typeof md.data.description === "string" ? md.data.description : "Custom personality",
      source: "custom",
      path: file,
    })
    }
  }

  return [...builtin, ...custom.toSorted((a, b) => a.name.localeCompare(b.name))]
}

export async function resolvePrompt(active: string | undefined, worktree: string) {
  if (!active || active === "default") return ""

  const builtin = getBuiltinPersonality(active)
  if (builtin) return builtin.prompt

  const file = personalityPath(worktree, sanitizeId(active))
  if (!(await Filesystem.exists(file))) return ""

  const md = await ConfigMarkdown.parse(file).catch(() => undefined)
  if (!md) return ""
  return md.content.trim()
}

export async function saveCustom(input: {
  worktree: string
  id: string
  name: string
  description?: string
  content: string
}) {
  const id = sanitizeId(input.id)
  const file = personalityPath(input.worktree, id)
  const body = [
    "---",
    `name: ${input.name}`,
    input.description ? `description: ${input.description}` : "",
    "---",
    "",
    input.content.trim(),
    "",
  ]
    .filter(Boolean)
    .join("\n")
  await Filesystem.write(file, body)
  return { id, path: file }
}

export async function removeCustom(worktree: string, id: string) {
  const file = personalityPath(worktree, sanitizeId(id))
  if (!(await Filesystem.exists(file))) return false
  await unlink(file)
  return true
}

export async function importFile(worktree: string, sourcePath: string, id?: string) {
  const resolved = path.resolve(sourcePath)
  if (!(await Filesystem.exists(resolved))) {
    throw new Error(`File not found: ${resolved}`)
  }
  const md = await ConfigMarkdown.parse(resolved)
  const nextId = sanitizeId(id ?? (typeof md.data.name === "string" ? md.data.name : path.basename(resolved, ".md")))
  const name = typeof md.data.name === "string" ? md.data.name : nextId
  const description = typeof md.data.description === "string" ? md.data.description : undefined
  return saveCustom({
    worktree,
    id: nextId,
    name,
    description,
    content: md.content.trim(),
  })
}

export function customPath(worktree: string, id: string) {
  return personalityPath(worktree, sanitizeId(id))
}
