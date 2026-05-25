import { BUNDLED_AUTO_CAPABILITIES } from "./registry"
import type { AwakenedCapabilityId } from "./ids"
import { normalizeAwakenedTokenMode, resolveCapabilityLimits, resolveCompactBootstrapContent, type AwakenedTokenMode } from "./tokenMode"

const BOOTSTRAP_SENT = new Set<string>()

export function resetAwakenedBootstrap(sessionID = "") {
  if (sessionID) BOOTSTRAP_SENT.delete(sessionID)
  else BOOTSTRAP_SENT.clear()
}

export function hasAwakenedBootstrap(sessionID: string) {
  return BOOTSTRAP_SENT.has(sessionID)
}

export function markAwakenedBootstrap(sessionID: string) {
  BOOTSTRAP_SENT.add(sessionID)
}

export type BootstrapAttachment = {
  skillName: string
  content: string
}

export function resolveAwakenedBootstrapAttachment(options: {
  sessionID: string
  agentMode?: "primary" | "subagent" | "all"
  autoCapabilities?: boolean
  tokenMode?: AwakenedTokenMode
  disabled?: AwakenedCapabilityId[]
}): BootstrapAttachment | undefined {
  if (options.autoCapabilities === false) return
  if (options.agentMode !== "primary") return
  if (BOOTSTRAP_SENT.has(options.sessionID)) return

  const mode = normalizeAwakenedTokenMode(options.tokenMode)
  const limits = resolveCapabilityLimits(mode)
  if (limits.skipBootstrap) return

  const disabled = new Set(options.disabled ?? [])
  const packs = BUNDLED_AUTO_CAPABILITIES.filter((cap) => !disabled.has(cap.id)).map(
    (cap) => `- **${cap.displayName}** — ${cap.description}`,
  )

  BOOTSTRAP_SENT.add(options.sessionID)

  if (mode !== "normal") {
    return {
      skillName: "Awakened Auto",
      content: resolveCompactBootstrapContent(packs.length),
    }
  }

  return {
    skillName: "Awakened Auto",
    content: [
      "# Awakened auto-routing",
      "",
      "Awakened preloads capability packs and built-in skills for primary agents. **Use them proactively** — do not wait for the user to name a skill or slash command.",
      "",
      "## Required tools",
      "",
      "- **task** — dispatch subagents (orchestrator when unsure)",
      "- **skill** — load matching built-in skill before creative, review, test, or domain work",
      "- **mem_search** / **mem_save** — recall and persist every turn (load **awakened-mem** / **mem-search** skills)",
      "",
      "## Built-in skills (load with skill tool)",
      "",
      "| Skill | When |",
      "|-------|------|",
      "| awakened-subagents | multi-step work, exploration, multi-file edits |",
      "| superpowers | features, creative work, TDD workflow |",
      "| brainstorming | design choices before implementation |",
      "| code-review | PR/diff review |",
      "| security-review | audits, OWASP, threat modeling |",
      "| testing / webapp-testing | unit, integration, Playwright E2E |",
      "| frontend | React, Next.js, Tailwind UI |",
      "| awakened-taste | premium anti-slop UI (Taste-Skill) |",
      "| design | Awakened brand, static HTML, UI/UX, a11y |",
      "| awakened-mem / mem-search | cross-session memory save & search |",
      "| docs-writer | README, API docs |",
      "| aws-cloud | Lambda, IAM, CDK on AWS |",
      "| graphify | large repo mapping, token reduction |",
      "| productivity | officialskills / VoltAgent catalog |",
      "| skills-catalog | browse famous GitHub skill repos |",
      "| cursor-skills / composio-skills / anthropic-skills / vercel-skills | major GitHub catalogs |",
      "| context7 | up-to-date library docs |",
      "| obsidian | Obsidian vault MCP (mcp-obsidian) |",
      "| self-improvement | /learn, /init, AGENTS.md learnings |",
      "| simplify | refactors, dead code removal |",
      "| customize-awakened | awakened.json / .awakened config only |",
      "",
      "## Auto capability packs (injected when relevant)",
      "",
      ...packs,
      "",
      "Matching packs are injected automatically each session. Load the **skill** tool for full playbooks when a pack matches.",
    ].join("\n"),
  }
}
