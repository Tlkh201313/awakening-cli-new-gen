import { Context, Effect, Layer } from "effect"

import { InstanceState } from "@/effect/instance-state"

import PROMPT_ANTHROPIC from "./prompt/anthropic.txt"
import PROMPT_DEFAULT from "./prompt/default.txt"
import PROMPT_BEAST from "./prompt/beast.txt"
import PROMPT_GEMINI from "./prompt/gemini.txt"
import PROMPT_GPT from "./prompt/gpt.txt"
import PROMPT_KIMI from "./prompt/kimi.txt"

import PROMPT_CODEX from "./prompt/codex.txt"
import PROMPT_TRINITY from "./prompt/trinity.txt"
import PROMPT_SUBAGENT_DISPATCH from "./prompt/subagent-dispatch.txt"
import PROMPT_SKILL_DISPATCH from "./prompt/skill-dispatch.txt"
import {
  getAwakenedTokenMode,
  PROMPT_CAVEMAN_OUTPUT,
  PROMPT_SKILL_DISPATCH_COMPACT,
  PROMPT_SUBAGENT_DISPATCH_COMPACT,
  shouldUseCompactDispatch,
  shouldUseCompactSkills,
} from "@/capabilities/tokenMode"
import type { Provider } from "@/provider/provider"
import type { Agent } from "@/agent/agent"
import { Permission } from "@/permission"
import { Skill } from "@/skill"
import { Config } from "@/config/config"

export function provider(model: Provider.Model) {
  if (model.api.id.includes("gpt-4") || model.api.id.includes("o1") || model.api.id.includes("o3"))
    return [PROMPT_BEAST]
  if (model.api.id.includes("gpt")) {
    if (model.api.id.includes("codex")) {
      return [PROMPT_CODEX]
    }
    return [PROMPT_GPT]
  }
  if (model.api.id.includes("gemini-")) return [PROMPT_GEMINI]
  if (model.api.id.includes("claude")) return [PROMPT_ANTHROPIC]
  if (model.api.id.toLowerCase().includes("trinity")) return [PROMPT_TRINITY]
  if (model.api.id.toLowerCase().includes("kimi")) return [PROMPT_KIMI]
  return [PROMPT_DEFAULT]
}

export interface Interface {
  readonly environment: (model: Provider.Model) => Effect.Effect<string[]>
  readonly skills: (agent: Agent.Info) => Effect.Effect<string | undefined>
  readonly subagentDispatch: (agent: Agent.Info) => Effect.Effect<string | undefined>
  readonly skillDispatch: (agent: Agent.Info) => Effect.Effect<string | undefined>
  readonly tokenModePrompt: (agent: Agent.Info) => Effect.Effect<string | undefined>
}

export class Service extends Context.Service<Service, Interface>()("@awakened/SystemPrompt") {}

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const skill = yield* Skill.Service
    const config = yield* Config.Service

    return Service.of({
      environment: Effect.fn("SystemPrompt.environment")(function* (model: Provider.Model) {
        const ctx = yield* InstanceState.context
        return [
          [
            `You are powered by the model named ${model.api.id}. The exact model ID is ${model.providerID}/${model.api.id}`,
            `Here is some useful information about the environment you are running in:`,
            `<env>`,
            `  Working directory: ${ctx.directory}`,
            `  Workspace root folder: ${ctx.worktree}`,
            `  Is directory a git repo: ${ctx.project.vcs === "git" ? "yes" : "no"}`,
            `  Platform: ${process.platform}`,
            `  Today's date: ${new Date().toDateString()}`,
            `</env>`,
          ].join("\n"),
        ]
      }),

      skills: Effect.fn("SystemPrompt.skills")(function* (agent: Agent.Info) {
        if (Permission.disabled(["skill"], agent.permission).has("skill")) return

        const list = yield* skill.available(agent)
        const mode = getAwakenedTokenMode(yield* config.get())
        const compact = shouldUseCompactSkills(mode)

        return [
          compact
            ? "Load matching skills proactively with the skill tool."
            : "Skills provide specialized instructions and workflows for specific tasks.\nYou MUST load matching skills proactively with the skill tool — do not wait for the user to name a skill.",
          Skill.fmt(list, { verbose: !compact }),
        ].join("\n")
      }),

      subagentDispatch: Effect.fn("SystemPrompt.subagentDispatch")(function* (agent: Agent.Info) {
        if (agent.mode !== "primary") return
        if (Permission.disabled(["task"], agent.permission).has("task")) return
        const mode = getAwakenedTokenMode(yield* config.get())
        return shouldUseCompactDispatch(mode) ? PROMPT_SUBAGENT_DISPATCH_COMPACT : PROMPT_SUBAGENT_DISPATCH
      }),

      skillDispatch: Effect.fn("SystemPrompt.skillDispatch")(function* (agent: Agent.Info) {
        if (agent.mode !== "primary") return
        if (Permission.disabled(["skill"], agent.permission).has("skill")) return
        const mode = getAwakenedTokenMode(yield* config.get())
        return shouldUseCompactDispatch(mode) ? PROMPT_SKILL_DISPATCH_COMPACT : PROMPT_SKILL_DISPATCH
      }),

      tokenModePrompt: Effect.fn("SystemPrompt.tokenModePrompt")(function* (agent: Agent.Info) {
        if (agent.mode !== "primary") return
        const mode = getAwakenedTokenMode(yield* config.get())
        if (mode !== "caveman") return
        return PROMPT_CAVEMAN_OUTPUT
      }),
    })
  }),
)

export const defaultLayer = layer.pipe(Layer.provide(Skill.defaultLayer), Layer.provide(Config.defaultLayer))

export * as SystemPrompt from "./system"
