import { Config, ConfigProvider, Context, Effect, Layer } from "effect"
import { ConfigService } from "@/effect/config-service"

const bool = (name: string) => Config.boolean(name).pipe(Config.withDefault(false))
const positiveInteger = (name: string) =>
  Config.number(name).pipe(
    Config.map((value) => (Number.isInteger(value) && value > 0 ? value : undefined)),
    Config.orElse(() => Config.succeed(undefined)),
  )
const experimental = bool("AWAKENED_EXPERIMENTAL")
const enabledByExperimental = (name: string) =>
  Config.all({ experimental, enabled: bool(name) }).pipe(Config.map((flags) => flags.experimental || flags.enabled))

export class Service extends ConfigService.Service<Service>()("@awakened/RuntimeFlags", {
  autoShare: bool("AWAKENED_AUTO_SHARE"),
  pure: bool("AWAKENED_PURE"),
  disableDefaultPlugins: bool("AWAKENED_DISABLE_DEFAULT_PLUGINS"),
  disableChannelDb: bool("AWAKENED_DISABLE_CHANNEL_DB"),
  disableEmbeddedWebUi: bool("AWAKENED_DISABLE_EMBEDDED_WEB_UI"),
  disableExternalSkills: bool("AWAKENED_DISABLE_EXTERNAL_SKILLS"),
  disableLspDownload: bool("AWAKENED_DISABLE_LSP_DOWNLOAD"),
  skipMigrations: bool("AWAKENED_SKIP_MIGRATIONS"),
  disableClaudeCodePrompt: Config.all({
    broad: bool("AWAKENED_DISABLE_CLAUDE_CODE"),
    direct: bool("AWAKENED_DISABLE_CLAUDE_CODE_PROMPT"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  disableClaudeCodeSkills: Config.all({
    broad: bool("AWAKENED_DISABLE_CLAUDE_CODE"),
    direct: bool("AWAKENED_DISABLE_CLAUDE_CODE_SKILLS"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  enableExa: Config.all({
    experimental,
    enabled: bool("AWAKENED_ENABLE_EXA"),
    legacy: bool("AWAKENED_EXPERIMENTAL_EXA"),
  }).pipe(Config.map((flags) => flags.experimental || flags.enabled || flags.legacy)),
  enableParallel: Config.all({
    enabled: bool("AWAKENED_ENABLE_PARALLEL"),
    legacy: bool("AWAKENED_EXPERIMENTAL_PARALLEL"),
  }).pipe(Config.map((flags) => flags.enabled || flags.legacy)),
  enableExperimentalModels: bool("AWAKENED_ENABLE_EXPERIMENTAL_MODELS"),
  enableQuestionTool: bool("AWAKENED_ENABLE_QUESTION_TOOL"),
  experimentalScout: enabledByExperimental("AWAKENED_EXPERIMENTAL_SCOUT"),
  experimentalBackgroundSubagents: enabledByExperimental("AWAKENED_EXPERIMENTAL_BACKGROUND_SUBAGENTS"),
  experimentalLspTy: bool("AWAKENED_EXPERIMENTAL_LSP_TY"),
  experimentalLspTool: enabledByExperimental("AWAKENED_EXPERIMENTAL_LSP_TOOL"),
  experimentalOxfmt: enabledByExperimental("AWAKENED_EXPERIMENTAL_OXFMT"),
  experimentalPlanMode: enabledByExperimental("AWAKENED_EXPERIMENTAL_PLAN_MODE"),
  experimentalEventSystem: enabledByExperimental("AWAKENED_EXPERIMENTAL_EVENT_SYSTEM"),
  experimentalWorkspaces: enabledByExperimental("AWAKENED_EXPERIMENTAL_WORKSPACES"),
  experimentalIconDiscovery: enabledByExperimental("AWAKENED_EXPERIMENTAL_ICON_DISCOVERY"),
  outputTokenMax: positiveInteger("AWAKENED_EXPERIMENTAL_OUTPUT_TOKEN_MAX"),
  bashDefaultTimeoutMs: positiveInteger("AWAKENED_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS"),
  experimentalNativeLlm: bool("AWAKENED_EXPERIMENTAL_NATIVE_LLM"),
  client: Config.string("AWAKENED_CLIENT").pipe(Config.withDefault("cli")),
}) {}

export type Info = Context.Service.Shape<typeof Service>

const emptyConfigLayer = Service.defaultLayer.pipe(
  Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))),
  Layer.orDie,
)

export const layer = (overrides: Partial<Info> = {}) =>
  Layer.effect(
    Service,
    Effect.gen(function* () {
      const flags = yield* Service
      return Service.of({ ...flags, ...overrides })
    }),
  ).pipe(Layer.provide(emptyConfigLayer))

export const defaultLayer = Service.defaultLayer.pipe(Layer.orDie)

export * as RuntimeFlags from "./runtime-flags"
