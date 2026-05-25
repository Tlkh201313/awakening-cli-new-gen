import type { Info as ConfigInfo } from "@/config/config"
import type { Entry } from "./store"
import * as MemoryStore from "./store"

export type MemoryAutoConfig = {
  autoSave: boolean
  autoRecall: boolean
  maxRecall: number
  defaultScope: "project" | "global"
}

export function getMemoryAutoConfig(cfg: ConfigInfo): MemoryAutoConfig {
  const memory = cfg.awakenedMemory
  return {
    autoSave: memory?.autoSave !== false,
    autoRecall: memory?.autoRecall !== false,
    maxRecall: memory?.maxRecall ?? 5,
    defaultScope: memory?.defaultScope ?? "project",
  }
}

const USER_REMEMBER_RES = [
  /\bremember(?:\s+(?:this|that))?[:\s]+(.+)/is,
  /\bsave(?:\s+to)?\s+memory[:\s]+(.+)/is,
  /\bmemorize[:\s]+(.+)/is,
  /\bfrom now on[,\s]+(.+)/is,
  /\bmy preference is[:\s]+(.+)/is,
  /\balways use[:\s]+(.+)/is,
  /\bnever use[:\s]+(.+)/is,
] as const

const SIGNIFICANT_TOOLS = new Set(["edit", "write", "apply_patch", "bash", "task", "multiedit"])

export function extractUserRemember(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return

  for (const pattern of USER_REMEMBER_RES) {
    const match = trimmed.match(pattern)
    const content = match?.[1]?.trim()
    if (!content || content.length < 8) continue
    const title = content.split(/\n/)[0]?.trim().slice(0, 72) || "User note"
    return { title, content: content.slice(0, 2000) }
  }
}

export async function autoSaveFromUser(text: string, worktree: string, cfg: MemoryAutoConfig) {
  if (!cfg.autoSave) return
  const extracted = extractUserRemember(text)
  if (!extracted) return
  return MemoryStore.saveUnique({
    title: extracted.title,
    content: extracted.content,
    tags: ["auto", "user"],
    scope: cfg.defaultScope,
    worktree,
  })
}

export async function recallForPrompt(text: string, worktree: string, cfg: MemoryAutoConfig) {
  if (!cfg.autoRecall) return []
  const query = text.trim()
  if (!query) return []
  return MemoryStore.search({
    query,
    limit: cfg.maxRecall,
    scope: "all",
    worktree,
  })
}

export function formatRecallInjection(entries: Entry[]) {
  if (!entries.length) return ""
  return [
    "# Awakened memory (auto-recalled)",
    "",
    "Relevant saved notes from prior sessions. Apply them; do not re-decide without reason.",
    "",
    MemoryStore.formatEntries(entries),
  ].join("\n")
}

type TurnSaveInput = {
  userText: string
  assistantText: string
  toolNames: string[]
  worktree: string
  cfg: MemoryAutoConfig
}

export async function autoSaveFromTurn(input: TurnSaveInput) {
  if (!input.cfg.autoSave) return
  if (extractUserRemember(input.userText)) return

  const significant = input.toolNames.filter((name) => SIGNIFICANT_TOOLS.has(name))
  if (significant.length === 0) return

  const summary = input.assistantText.trim().slice(0, 600)
  if (summary.length < 40) return

  const title = input.userText.trim().split(/\n/)[0]?.slice(0, 72) || "Session note"
  const content = [
    `Tools: ${[...new Set(significant)].join(", ")}`,
    "",
    summary,
  ].join("\n")

  return MemoryStore.saveUnique({
    title: title.length > 0 ? title : "Session note",
    content,
    tags: ["auto", "turn"],
    scope: input.cfg.defaultScope,
    worktree: input.worktree,
  })
}

export async function autoSaveFromTool(input: {
  tool: string
  title: string
  output: string
  worktree: string
  cfg: MemoryAutoConfig
}) {
  if (!input.cfg.autoSave) return
  if (input.tool.startsWith("mem_")) return
  if (!SIGNIFICANT_TOOLS.has(input.tool)) return

  const output = input.output.trim()
  if (output.length < 20) return

  return MemoryStore.saveUnique({
    title: input.title.trim().slice(0, 72) || `${input.tool} result`,
    content: output.slice(0, 1200),
    tags: ["auto", "tool", input.tool],
    scope: input.cfg.defaultScope,
    worktree: input.worktree,
  })
}

export * as MemoryAuto from "./auto"
