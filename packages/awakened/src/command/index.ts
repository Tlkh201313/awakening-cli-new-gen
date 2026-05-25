import { BusEvent } from "@/bus/bus-event"
import { InstanceState } from "@/effect/instance-state"
import { EffectBridge } from "@/effect/bridge"
import type { InstanceContext } from "@/project/instance-context"
import { SessionID, MessageID } from "@/session/schema"
import { Effect, Layer, Context, Schema } from "effect"
import { Config } from "@/config/config"
import { MCP } from "../mcp"
import { Skill } from "../skill"
import PROMPT_AWAKENED_SUBAGENTS from "./template/awakened-subagents.txt"
import PROMPT_COMMIT from "./template/commit.txt"
import PROMPT_DEBUG from "./template/debug.txt"
import PROMPT_HANDOFF from "./template/handoff.txt"
import PROMPT_INITIALIZE from "./template/initialize.txt"
import PROMPT_MEM_SEARCH from "./template/mem-search.txt"
import PROMPT_PERSONALITY_GENERATE from "./template/personality-generate.txt"
import PROMPT_REMEMBER from "./template/remember.txt"
import PROMPT_REVIEW from "./template/review.txt"

type State = {
  commands: Record<string, Info>
}

export const Event = {
  Executed: BusEvent.define(
    "command.executed",
    Schema.Struct({
      name: Schema.String,
      sessionID: SessionID,
      arguments: Schema.String,
      messageID: MessageID,
    }),
  ),
}

export const Info = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  agent: Schema.optional(Schema.String),
  model: Schema.optional(Schema.String),
  source: Schema.optional(Schema.Literals(["command", "mcp", "skill"])),
  // Some command templates are lazy promises from MCP prompt resolution.
  template: Schema.Unknown,
  subtask: Schema.optional(Schema.Boolean),
  hints: Schema.Array(Schema.String),
}).annotate({ identifier: "Command" })

export type Info = Omit<Schema.Schema.Type<typeof Info>, "template"> & { template: Promise<string> | string }

export function hints(template: string) {
  const result: string[] = []
  const numbered = template.match(/\$\d+/g)
  if (numbered) {
    for (const match of [...new Set(numbered)].sort()) result.push(match)
  }
  if (template.includes("$ARGUMENTS")) result.push("$ARGUMENTS")
  return result
}

export const Default = {
  INIT: "init",
  REVIEW: "review",
  COMMIT: "commit",
  DEBUG: "debug",
  HANDOFF: "handoff",
  REMEMBER: "remember",
  MEM_SEARCH: "mem-search",
  AWAKENED_SUBAGENTS: "awakened-subagents",
  PERSONALITY_GENERATE: "personality-generate",
} as const

export interface Interface {
  readonly get: (name: string) => Effect.Effect<Info | undefined>
  readonly list: () => Effect.Effect<Info[]>
}

export class Service extends Context.Service<Service, Interface>()("@awakened/Command") {}

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const config = yield* Config.Service
    const mcp = yield* MCP.Service
    const skill = yield* Skill.Service

    const init = Effect.fn("Command.state")(function* (ctx: InstanceContext) {
      const cfg = yield* config.get()
      const bridge = yield* EffectBridge.make()
      const commands: Record<string, Info> = {}

      commands[Default.INIT] = {
        name: Default.INIT,
        description: "guided AGENTS.md setup",
        source: "command",
        get template() {
          return PROMPT_INITIALIZE.replace("${path}", ctx.worktree)
        },
        hints: hints(PROMPT_INITIALIZE),
      }
      commands[Default.REVIEW] = {
        name: Default.REVIEW,
        description: "review changes [commit|branch|pr], defaults to uncommitted",
        source: "command",
        get template() {
          return PROMPT_REVIEW.replace("${path}", ctx.worktree)
        },
        subtask: true,
        hints: hints(PROMPT_REVIEW),
      }
      commands[Default.COMMIT] = {
        name: Default.COMMIT,
        description: "write a conventional commit message for current changes",
        source: "command",
        get template() {
          return PROMPT_COMMIT.replace("${path}", ctx.worktree)
        },
        subtask: true,
        hints: hints(PROMPT_COMMIT),
      }
      commands[Default.DEBUG] = {
        name: Default.DEBUG,
        description: "debug a failure [error message|test name]",
        source: "command",
        get template() {
          return PROMPT_DEBUG.replace("${path}", ctx.worktree)
        },
        subtask: true,
        hints: hints(PROMPT_DEBUG),
      }
      commands[Default.HANDOFF] = {
        name: Default.HANDOFF,
        description: "summarize session progress for a fresh continue",
        source: "command",
        get template() {
          return PROMPT_HANDOFF.replace("${path}", ctx.worktree)
        },
        subtask: true,
        hints: hints(PROMPT_HANDOFF),
      }
      commands[Default.REMEMBER] = {
        name: Default.REMEMBER,
        description: "save durable notes to awakened-memory",
        source: "command",
        get template() {
          return PROMPT_REMEMBER.replace("${path}", ctx.worktree)
        },
        hints: hints(PROMPT_REMEMBER),
      }
      commands[Default.MEM_SEARCH] = {
        name: Default.MEM_SEARCH,
        description: "search awakened-memory entries",
        source: "command",
        get template() {
          return PROMPT_MEM_SEARCH.replace("${path}", ctx.worktree)
        },
        hints: hints(PROMPT_MEM_SEARCH),
      }
      commands[Default.AWAKENED_SUBAGENTS] = {
        name: Default.AWAKENED_SUBAGENTS,
        description: "dispatch native subagents via task tool (VoltAgent-inspired routing)",
        source: "command",
        get template() {
          return PROMPT_AWAKENED_SUBAGENTS.replace("${path}", ctx.worktree)
        },
        subtask: true,
        hints: hints(PROMPT_AWAKENED_SUBAGENTS),
      }
      commands[Default.PERSONALITY_GENERATE] = {
        name: Default.PERSONALITY_GENERATE,
        description: "generate a custom personality file in .awakened/personalities/",
        source: "command",
        get template() {
          return PROMPT_PERSONALITY_GENERATE.replace("${path}", ctx.worktree)
        },
        subtask: true,
        hints: hints(PROMPT_PERSONALITY_GENERATE),
      }

      for (const [name, command] of Object.entries(cfg.command ?? {})) {
        commands[name] = {
          name,
          agent: command.agent,
          model: command.model,
          description: command.description,
          source: "command",
          get template() {
            return command.template
          },
          subtask: command.subtask,
          hints: hints(command.template),
        }
      }

      for (const [name, prompt] of Object.entries(yield* mcp.prompts())) {
        commands[name] = {
          name,
          source: "mcp",
          description: prompt.description,
          get template() {
            return bridge.promise(
              mcp
                .getPrompt(
                  prompt.client,
                  prompt.name,
                  prompt.arguments
                    ? Object.fromEntries(prompt.arguments.map((argument, i) => [argument.name, `$${i + 1}`]))
                    : {},
                )
                .pipe(
                  Effect.map(
                    (template) =>
                      template?.messages
                        .map((message) => (message.content.type === "text" ? message.content.text : ""))
                        .join("\n") || "",
                  ),
                ),
            )
          },
          hints: prompt.arguments?.map((_, i) => `$${i + 1}`) ?? [],
        }
      }

      for (const item of yield* skill.all()) {
        if (commands[item.name]) continue
        commands[item.name] = {
          name: item.name,
          description: item.description,
          source: "skill",
          get template() {
            return item.content
          },
          hints: [],
        }
      }

      return {
        commands,
      }
    })

    const state = yield* InstanceState.make<State>((ctx) => init(ctx))

    const get = Effect.fn("Command.get")(function* (name: string) {
      const s = yield* InstanceState.get(state)
      return s.commands[name]
    })

    const list = Effect.fn("Command.list")(function* () {
      const s = yield* InstanceState.get(state)
      return Object.values(s.commands)
    })

    return Service.of({ get, list })
  }),
)

export const defaultLayer = layer.pipe(
  Layer.provide(Config.defaultLayer),
  Layer.provide(MCP.defaultLayer),
  Layer.provide(Skill.defaultLayer),
)

export * as Command from "."
