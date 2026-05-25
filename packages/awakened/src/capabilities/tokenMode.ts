import type { Info as ConfigInfo } from "@/config/config"
export const AWAKENED_TOKEN_MODES = ["normal", "efficient", "caveman"] as const
export type AwakenedTokenMode = (typeof AWAKENED_TOKEN_MODES)[number]

const TOKEN_MODE_LABEL: Record<AwakenedTokenMode, string> = {
  normal: "Normal",
  efficient: "Efficient",
  caveman: "Caveman",
}

export function normalizeAwakenedTokenMode(value: string | undefined): AwakenedTokenMode {
  if (value === "efficient" || value === "caveman") return value
  return "normal"
}

export function getAwakenedTokenMode(cfg: ConfigInfo): AwakenedTokenMode {
  return normalizeAwakenedTokenMode(cfg.awakenedCapabilities?.tokenMode)
}

export function tokenModeLabel(mode: AwakenedTokenMode) {
  return TOKEN_MODE_LABEL[mode]
}

export function nextAwakenedTokenMode(mode: AwakenedTokenMode): AwakenedTokenMode {
  const index = AWAKENED_TOKEN_MODES.indexOf(mode)
  return AWAKENED_TOKEN_MODES[(index + 1) % AWAKENED_TOKEN_MODES.length] ?? "normal"
}

export function resolveCapabilityLimits(mode: AwakenedTokenMode) {
  if (mode === "caveman") return { maxPerTurn: 1, maxBootstrap: 1, skipBootstrap: true }
  if (mode === "efficient") return { maxPerTurn: 1, maxBootstrap: 2, skipBootstrap: false }
  return { maxPerTurn: 2, maxBootstrap: 6, skipBootstrap: false }
}

export function shouldUseCompactDispatch(mode: AwakenedTokenMode) {
  return mode !== "normal"
}

export function shouldUseCompactSkills(mode: AwakenedTokenMode) {
  return mode !== "normal"
}

export const PROMPT_SUBAGENT_DISPATCH_COMPACT = `# Subagents (required)
Primary agent: dispatch via task. First turn: task before read/grep/edit.
orchestrator=multi | explore=find | builder=impl | reviewer=review | debugger=tests
Parallel when independent. Summarize for user.`

export const PROMPT_SKILL_DISPATCH_COMPACT = `# Skills (required)
Load matching skill proactively via skill tool.
Multi-step→awakened-subagents | feature→superpowers | review→code-review | test→testing | UI→frontend
mem_search before reversing decisions.`

export const PROMPT_CAVEMAN_OUTPUT = `# Token mode: caveman
User enabled cost-saving mode. Reply ultra-terse: drop articles/filler/hedging, fragments OK, short synonyms.
Keep code blocks, API names, and error strings exact. Pattern: [thing] [action] [reason]. [next].
Only revert verbosity for security warnings or irreversible confirmations.`

export function resolveCompactBootstrapContent(packCount: number) {
  return [
    "# Awakened auto-routing (compact)",
    "",
    "Use task for subagents, skill for playbooks, mem_search before reversing decisions.",
    `${packCount} capability packs auto-inject when relevant. Load skill tool for full playbooks.`,
  ].join("\n")
}
