export * as MemoryStore from "./store"

import path from "path"
import { Global } from "@awakened-ai/core/global"
import { Filesystem } from "@/util/filesystem"

export type Scope = "global" | "project" | "all"

export type Entry = {
  id: string
  title: string
  content: string
  tags: string[]
  scope: "global" | "project"
  project?: string
  created: number
  updated: number
}

type SaveInput = {
  title: string
  content: string
  tags?: string[]
  scope?: "global" | "project"
  worktree: string
}

type SearchInput = {
  query: string
  limit?: number
  scope?: Scope
  worktree: string
}

function globalFile() {
  return path.join(Global.Path.data, "memory", "entries.jsonl")
}

function projectFile(worktree: string) {
  return path.join(worktree, ".awakened", "memory", "entries.jsonl")
}

function normalizeTags(tags?: string[]) {
  if (!tags?.length) return []
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
}

function parseLine(line: string): Entry | undefined {
  if (!line.trim()) return
  try {
    return JSON.parse(line) as Entry
  } catch {
    return
  }
}

async function readFile(file: string) {
  if (!(await Filesystem.exists(file))) return []
  const text = await Filesystem.readText(file)
  return text
    .split("\n")
    .map(parseLine)
    .filter((entry): entry is Entry => entry !== undefined)
}

async function readAll(worktree: string, scope: Scope) {
  const entries: Entry[] = []
  if (scope === "global" || scope === "all") entries.push(...(await readFile(globalFile())))
  if (scope === "project" || scope === "all") entries.push(...(await readFile(projectFile(worktree))))
  return entries.toSorted((a, b) => b.updated - a.updated)
}

function score(entry: Entry, query: string) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
  if (!terms.length) return 0

  const haystack = [entry.title, entry.content, entry.tags.join(" "), entry.project ?? ""].join("\n").toLowerCase()
  let value = 0
  for (const term of terms) {
    if (entry.title.toLowerCase().includes(term)) value += 4
    if (entry.tags.some((tag) => tag.includes(term))) value += 3
    if (haystack.includes(term)) value += 1
  }
  return value
}

async function append(file: string, entry: Entry) {
  const line = `${JSON.stringify(entry)}\n`
  if (await Filesystem.exists(file)) {
    await Filesystem.write(file, (await Filesystem.readText(file)) + line)
    return
  }
  await Filesystem.write(file, line)
}

function fingerprint(title: string, content: string) {
  return `${title.toLowerCase().trim()}::${content.toLowerCase().trim().slice(0, 240)}`
}

async function hasDuplicate(worktree: string, scope: "global" | "project", title: string, content: string) {
  const entries = await readAll(worktree, scope)
  const key = fingerprint(title, content)
  return entries.some((entry) => fingerprint(entry.title, entry.content) === key)
}

export async function saveUnique(input: SaveInput) {
  const scope = input.scope ?? "project"
  if (await hasDuplicate(input.worktree, scope, input.title, input.content)) return
  return save(input)
}

export async function save(input: SaveInput) {
  const scope = input.scope ?? "project"
  const now = Date.now()
  const entry: Entry = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    content: input.content.trim(),
    tags: normalizeTags(input.tags),
    scope,
    project: scope === "project" ? input.worktree : undefined,
    created: now,
    updated: now,
  }
  if (!entry.title || !entry.content) throw new Error("Memory title and content are required")

  const file = scope === "global" ? globalFile() : projectFile(input.worktree)
  await append(file, entry)
  return entry
}

export async function search(input: SearchInput) {
  const limit = input.limit ?? 8
  const scope = input.scope ?? "all"
  const entries = await readAll(input.worktree, scope)
  if (!input.query.trim()) return entries.slice(0, limit)

  return entries
    .map((entry) => ({ entry, value: score(entry, input.query) }))
    .filter((item) => item.value > 0)
    .toSorted((a, b) => b.value - a.value || b.entry.updated - a.entry.updated)
    .slice(0, limit)
    .map((item) => item.entry)
}

export async function list(input: { limit?: number; scope?: Scope; worktree: string }) {
  const entries = await readAll(input.worktree, input.scope ?? "all")
  return entries.slice(0, input.limit ?? 20)
}

export function formatEntry(entry: Entry) {
  const tags = entry.tags.length ? ` [${entry.tags.join(", ")}]` : ""
  return `- **${entry.title}** (${entry.scope}${tags})\n  ${entry.content}`
}

export function formatEntries(entries: Entry[]) {
  if (!entries.length) return "No memories found."
  return entries.map(formatEntry).join("\n\n")
}
