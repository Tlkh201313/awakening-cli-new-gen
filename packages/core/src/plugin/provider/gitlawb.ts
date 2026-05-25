import { DateTime, Effect } from "effect"
import { ModelV2 } from "../../model"
import { ModelsDev } from "../../models-dev"
import { PluginV2 } from "../../plugin"
import { ProviderV2 } from "../../provider"

export const providerID = ProviderV2.ID.make("gitlawb-opengateway")
const baseURL = "https://opengateway.gitlawb.com/v1"
const freeCost = [{ input: 0, output: 0, cache: { read: 0, write: 0 } }]
const releaseDate = "2026-01-01"

const models = [
  {
    id: ModelV2.ID.make("mimo-v2.5-pro"),
    name: "MiMo V2.5 Pro",
    limit: { context: 1_000_000, output: 128_000 },
    capabilities: { tools: true, input: ["text"], output: ["text"] },
    reasoning: true,
    interleaved: { field: "reasoning_content" as const },
  },
  {
    id: ModelV2.ID.make("mimo-v2-pro"),
    name: "MiMo V2 Pro",
    limit: { context: 1_000_000, output: 128_000 },
    capabilities: { tools: true, input: ["text"], output: ["text"] },
    reasoning: true,
    interleaved: { field: "reasoning_content" as const },
  },
  {
    id: ModelV2.ID.make("mimo-v2.5"),
    name: "MiMo V2.5",
    limit: { context: 1_000_000, output: 128_000 },
    capabilities: { tools: true, input: ["text", "image"], output: ["text"] },
    reasoning: false,
  },
  {
    id: ModelV2.ID.make("mimo-v2-omni"),
    name: "MiMo V2 Omni",
    limit: { context: 256_000, output: 128_000 },
    capabilities: { tools: true, input: ["text", "image"], output: ["text"] },
    reasoning: false,
  },
  {
    id: ModelV2.ID.make("mimo-v2-flash"),
    name: "MiMo V2 Flash",
    limit: { context: 256_000, output: 64_000 },
    capabilities: { tools: true, input: ["text"], output: ["text"] },
    reasoning: false,
  },
  {
    id: ModelV2.ID.make("google/gemini-3.1-flash-lite-preview"),
    name: "Gemini 3.1 Flash Lite Preview",
    limit: { context: 200_000, output: 32_000 },
    capabilities: { tools: true, input: ["text"], output: ["text"] },
    reasoning: false,
  },
]

export const ModelsDevProvider: ModelsDev.Provider = {
  id: providerID,
  name: "Gitlawb Opengateway",
  env: ["OPENGATEWAY_API_KEY", "GITLAWB_OPENGATEWAY_API_KEY"],
  npm: "@ai-sdk/openai-compatible",
  api: baseURL,
  models: Object.fromEntries(
    models.map((spec) => [
      spec.id,
      {
        id: String(spec.id),
        name: spec.name,
        family: spec.id.startsWith("google/") ? "gemini" : "mimo",
        release_date: releaseDate,
        attachment: spec.capabilities.input.includes("image"),
        reasoning: spec.reasoning ?? false,
        temperature: true,
        tool_call: spec.capabilities.tools,
        ...(spec.interleaved ? { interleaved: spec.interleaved } : {}),
        modalities: {
          input: spec.capabilities.input as NonNullable<ModelsDev.Model["modalities"]>["input"],
          output: spec.capabilities.output as NonNullable<ModelsDev.Model["modalities"]>["output"],
        },
        limit: spec.limit,
        cost: { input: 0, output: 0 },
      },
    ]),
  ),
}

function resolveApiKey() {
  return process.env.OPENGATEWAY_API_KEY || process.env.GITLAWB_OPENGATEWAY_API_KEY
}

function resolveEnvName() {
  if (process.env.OPENGATEWAY_API_KEY) return "OPENGATEWAY_API_KEY"
  if (process.env.GITLAWB_OPENGATEWAY_API_KEY) return "GITLAWB_OPENGATEWAY_API_KEY"
  return undefined
}

function normalizeBaseURL(input: string) {
  return input
    .replace(/\/v1\/(?:xiaomi-mimo|gmi-cloud)\/?$/, "/v1")
    .replace(/\/(?:xiaomi-mimo|gmi-cloud)\/?$/, "")
}

export const GitlawbPlugin = PluginV2.define({
  id: PluginV2.ID.make("gitlawb-opengateway"),
  effect: Effect.gen(function* () {
    return {
      "catalog.transform": Effect.fn(function* (evt) {
        const envName = resolveEnvName()
        const existing = evt.data.find((record) => record.provider.id === providerID)

        if (!existing) {
          evt.provider.update(providerID, (provider) => {
            provider.name = ModelsDevProvider.name
            provider.env = [...ModelsDevProvider.env]
            provider.endpoint = {
              type: "aisdk",
              package: "@ai-sdk/openai-compatible",
              url: baseURL,
            }
            if (envName) provider.enabled = { via: "env", name: envName }
          })
        } else if (envName) {
          evt.provider.update(providerID, (provider) => {
            provider.enabled = { via: "env", name: envName }
          })
        }

        const record = evt.data.find((item) => item.provider.id === providerID)
        for (const spec of models) {
          if (record?.models.has(spec.id)) continue
          evt.model.update(providerID, spec.id, (draft) => {
            draft.name = spec.name
            draft.apiID = spec.id
            draft.endpoint = {
              type: "aisdk",
              package: "@ai-sdk/openai-compatible",
              url: baseURL,
            }
            draft.capabilities = spec.capabilities
            draft.limit = spec.limit
            draft.cost = freeCost
            draft.enabled = true
            draft.status = "active"
            draft.time.released = DateTime.makeUnsafe(Date.now())
          })
        }

        const final = evt.data.find((item) => item.provider.id === providerID)
        if (!final) return
        for (const modelID of final.models.keys()) {
          evt.model.update(providerID, modelID, (draft) => {
            draft.cost = freeCost
          })
        }
      }),
      "aisdk.sdk": Effect.fn(function* (evt) {
        if (evt.model.providerID !== providerID) return
        if (evt.package !== "@ai-sdk/openai-compatible") return
        const mod = yield* Effect.promise(() => import("@ai-sdk/openai-compatible"))
        evt.sdk = mod.createOpenAICompatible({
          ...evt.options,
          apiKey: resolveApiKey() ?? evt.options.apiKey,
          baseURL: normalizeBaseURL(
            typeof evt.options.baseURL === "string" ? evt.options.baseURL : baseURL,
          ),
          name: providerID,
        })
      }),
    }
  }),
})
