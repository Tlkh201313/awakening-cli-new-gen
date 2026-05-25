import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const SUBAGENTS_RE =
  /\b(subagents?|orchestrat\w*|dispatch|multi[\s-]?step|parallel\s+(?:agents?|tasks?|work)|background\s+(?:agents?|tasks?)|spawn\s+(?:agents?|subagents?)|cavecrew|awk3nd|agent[\s-]?harness|task tool|verify[\s-]?changes?|init(?:ialize)?[\s-]?(?:this\s+)?repo|bootstrap(?:\s+the)?\s+repo|awesome[\s-]?claude[\s-]?code[\s-]?subagents?|voltagent|@(?:orchestrator|builder|architect|reviewer|debugger|explore|verifier|scout|general))\b/i

export const awakenedSubagentsCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.subagents,
  displayName: "Awakened Subagents",
  description: "Native subagent routing — task tool dispatch, multi-file builder, VoltAgent-inspired catalog",
  priority: 90,
  shouldActivate(ctx) {
    if (SUBAGENTS_RE.test(ctx.userText)) return true
    if (ctx.autoSubagents === false) return false
    if (ctx.agentMode !== "primary") return false
    if (!ctx.toolNames.includes("task")) return false
    if (ctx.userText.trim().length > 0) return true
    return primaryBootstrap(ctx)
  },
  getContent() {
    return [
      "# Awakened Subagents",
      "",
      "Preinstalled routing pack (fork of VoltAgent awesome-claude-code-subagents, adapted for Awakened).",
      "Primary agents receive this pack automatically on the first message (when autoSubagents is enabled).",
      "",
      "Invoke Skill `awakened-subagents` or `/awakened-subagents`.",
      "",
      "## You MUST use the task tool",
      "",
      "Do not inline work that matches a subagent below. Call `task` with `subagent_type`.",
      "Use **orchestrator** when unsure — it dispatches the right specialists.",
      "",
      "## Route",
      "",
      "| Trigger | subagent_type |",
      "|---------|---------------|",
      "| multi-step / mixed | orchestrator |",
      "| find / map code | explore |",
      "| external docs | scout |",
      "| design plan | architect |",
      "| implement 2+ files | builder |",
      "| TS refactor | typescript-pro |",
      "| UI work | frontend-developer |",
      "| failing tests | debugger, test-automator |",
      "| review diff | reviewer |",
      "| security | security-auditor |",
      "| docs | writer |",
      "| after 3+ edits | verifier |",
      "",
      "## Multi-file",
      "",
      "builder / typescript-pro / frontend-developer: one turn, apply_patch or parallel edits.",
      "",
      "## Speed (non-blocking)",
      "",
      "When background subagents are enabled, launch **explore**, **scout**, **reviewer**, and **architect** with `background: true` so the parent keeps working. Poll with `task_status` or let results inject when done.",
      "",
      "Launch independent subtasks in **one message** with multiple parallel `task` calls.",
      "",
      "## Mention syntax",
      "",
      "User `@builder fix auth` → immediate `task` call with subagent_type builder.",
    ].join("\n")
  },
}

/** @deprecated Use awakenedSubagentsCapability */
export const awakenedAgentsCapability = awakenedSubagentsCapability
