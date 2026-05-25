export * as MemoryStore from "./store"

import path from "path"
import { appendFile, stat, mkdir } from "fs/promises"
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

const cache = new Map<string, { entries: Entry[]; mtime: number }>()

async function readFileCached(file: string): Promise<Entry[]> {
  try {
    const s = await stat(file)
    const cached = cache.get(file)
    if (cached && cached.mtime === s.mtimeMs) return cached.entries
    const text = await Bun.file(file).text()
    const entries = text
      .split("\n")
      .map(parseLine)
      .filter((entry): entry is Entry => entry !== undefined)
    cache.set(file, { entries, mtime: s.mtimeMs })
    return entries
  } catch {
    return []
  }
}

function invalidateCache(file: string) {
  cache.delete(file)
}

async function readAll(worktree: string, scope: Scope) {
  const entries: Entry[] = []
  if (scope === "global" || scope === "all") entries.push(...(await readFileCached(globalFile())))
  if (scope === "project" || scope === "all") entries.push(...(await readFileCached(projectFile(worktree))))
  return entries.toSorted((a, b) => b.updated - a.updated)
}

function levenshtein(a: string, b: string): number {
  if (a === "") return b.length
  if (b === "") return a.length
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
    }
  }
  return matrix[a.length][b.length]
}

function fuzzyIncludes(text: string, term: string): boolean {
  if (text.includes(term)) return true
  if (term.length < 3) return false
  const words = text.split(/\s+/)
  return words.some((word) => {
    if (Math.abs(word.length - term.length) > 2) return false
    return levenshtein(word, term) <= 2
  })
}

const ONE_DAY = 86_400_000

function recencyBonus(updated: number): number {
  const age = Date.now() - updated
  if (age < ONE_DAY) return 3
  if (age < 7 * ONE_DAY) return 2
  if (age < 30 * ONE_DAY) return 1
  return 0
}

function score(entry: Entry, query: string) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
  if (!terms.length) return 0

  const titleLower = entry.title.toLowerCase()
  const tagsJoined = entry.tags.join(" ")
  const haystack = [entry.title, entry.content, tagsJoined, entry.project ?? ""].join("\n").toLowerCase()
  let value = 0
  let matchedTerms = 0
  for (const term of terms) {
    let termMatched = false
    if (titleLower.includes(term) || fuzzyIncludes(titleLower, term)) { value += 4; termMatched = true }
    if (entry.tags.some((tag) => tag.includes(term) || fuzzyIncludes(tag, term))) { value += 3; termMatched = true }
    if (haystack.includes(term) || fuzzyIncludes(haystack, term)) { value += 1; termMatched = true }
    if (termMatched) matchedTerms++
  }
  if (terms.length > 1 && matchedTerms > 1) value += matchedTerms * 2
  value += recencyBonus(entry.updated)
  return value
}

async function append(file: string, entry: Entry) {
  const line = `${JSON.stringify(entry)}\n`
  const dir = path.dirname(file)
  await mkdir(dir, { recursive: true })
  await appendFile(file, line, "utf-8")
  invalidateCache(file)
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
