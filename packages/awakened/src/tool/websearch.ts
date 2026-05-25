import { Effect, Schema } from "effect"
import { HttpClient } from "effect/unstable/http"
import * as Tool from "./tool"
import * as McpWebSearch from "./mcp-websearch"
import DESCRIPTION from "./websearch.txt"
import { checksum } from "@awakened-ai/core/util/encode"
import { InstallationVersion } from "@awakened-ai/core/installation/version"
import { RuntimeFlags } from "@/effect/runtime-flags"
import { Config } from "@/config/config"

export const Parameters = Schema.Struct({
  query: Schema.String.annotate({ description: "Websearch query" }),
  numResults: Schema.optional(Schema.Number).annotate({
    description: "Number of search results to return (default: 8)",
  }),
  livecrawl: Schema.optional(Schema.Literals(["fallback", "preferred"])).annotate({
    description:
      "Live crawl mode - 'fallback': use live crawling as backup if cached content unavailable, 'preferred': prioritize live crawling (default: 'fallback')",
  }),
  type: Schema.optional(Schema.Literals(["auto", "fast", "deep"])).annotate({
    description: "Search type - 'fast': quick results (default), 'auto': balanced, 'deep': comprehensive search",
  }),
  contextMaxCharacters: Schema.optional(Schema.Number).annotate({
    description: "Maximum characters for context string optimized for LLMs (default: 10000)",
  }),
})

const WebSearchProviderSchema = Schema.Literals(["exa", "parallel"])
export type WebSearchProvider = Schema.Schema.Type<typeof WebSearchProviderSchema>

export type WebSearchProviderPreference = "auto" | WebSearchProvider

export function expandSearchQueries(query: string, year = new Date().getFullYear()) {
  const trimmed = query.trim()
  const queries = new Set<string>([trimmed])

  if (!trimmed.includes(String(year)) && /\b(latest|recent|current|new|today|now|this year)\b/i.test(trimmed)) {
    queries.add(`${trimmed} ${year}`)
  }

  const parts = trimmed.split(/\s+(?:and|&)\s+/i)
  if (parts.length > 1) {
    for (const part of parts) {
      const next = part.trim()
      if (next) queries.add(next)
    }
  }

  const quoted = trimmed.match(/"([^"]+)"/g)
  if (quoted?.length) {
    for (const match of quoted) {
      const next = match.slice(1, -1).trim()
      if (next) queries.add(next)
    }
  }

  return [...queries].slice(0, 4)
}

export function selectWebSearchProvider(
  sessionID: string,
  flags = { exa: false, parallel: false },
  preference: WebSearchProviderPreference = "auto",
): WebSearchProvider {
  const override = process.env.AWAKENED_WEBSEARCH_PROVIDER
  if (override === "exa" || override === "parallel") return override
  if (preference === "exa" || preference === "parallel") return preference
  if (flags.parallel) return "parallel"
  if (flags.exa) return "exa"

  return Number.parseInt(checksum(sessionID) ?? "0", 36) % 2 === 0 ? "exa" : "parallel"
}

export function alternateWebSearchProvider(provider: WebSearchProvider): WebSearchProvider {
  return provider === "exa" ? "parallel" : "exa"
}

export function webSearchProviderLabel(provider: unknown) {
  if (provider === "parallel") return "Parallel Web Search"
  if (provider === "exa") return "Exa Web Search"
  return "Web Search"
}

export function webSearchProviderPreferenceLabel(preference: WebSearchProviderPreference) {
  if (preference === "auto") return "Auto"
  return webSearchProviderLabel(preference)
}

export function nextWebSearchProviderPreference(
  preference: WebSearchProviderPreference,
): WebSearchProviderPreference {
  if (preference === "auto") return "exa"
  if (preference === "exa") return "parallel"
  return "auto"
}

export function webSearchModelName(extra: Tool.Context["extra"]) {
  const model = extra?.model
  if (!model || typeof model !== "object") return undefined
  const api = "api" in model && model.api && typeof model.api === "object" ? model.api : undefined
  const apiID = api && "id" in api && typeof api.id === "string" ? api.id : undefined
  const id = "id" in model && typeof model.id === "string" ? model.id : undefined
  return (apiID ?? id)?.slice(0, 100)
}

function searchTimeout(type?: "auto" | "fast" | "deep") {
  if (type === "deep") return "30 seconds"
  if (type === "fast") return "12 seconds"
  return "18 seconds"
}

function parallelAuthHeaders() {
  const headers = { "User-Agent": `awakened/${InstallationVersion}` }
  if (!process.env.PARALLEL_API_KEY) return headers
  return { ...headers, Authorization: `Bearer ${process.env.PARALLEL_API_KEY}` }
}

function callProvider(
  http: HttpClient.HttpClient,
  provider: WebSearchProvider,
  params: Schema.Schema.Type<typeof Parameters>,
  ctx: Tool.Context,
) {
  const searchType = params.type ?? "fast"

  if (provider === "parallel") {
    return McpWebSearch.call(
      http,
      McpWebSearch.PARALLEL_URL,
      "web_search",
      McpWebSearch.ParallelSearchArgs,
      {
        objective: params.query,
        search_queries: expandSearchQueries(params.query),
        session_id: ctx.sessionID,
        model_name: webSearchModelName(ctx.extra),
      },
      searchTimeout(searchType),
      parallelAuthHeaders(),
    )
  }

  return McpWebSearch.call(
    http,
    McpWebSearch.EXA_URL,
    "web_search_exa",
    McpWebSearch.SearchArgs,
    {
      query: params.query,
      type: searchType,
      numResults: params.numResults || 8,
      livecrawl: params.livecrawl || "fallback",
      contextMaxCharacters: params.contextMaxCharacters,
    },
    searchTimeout(searchType),
  )
}

function formatSearchError(error: unknown) {
  if (error instanceof Error) return error.message
  return "Unknown search error"
}

export const WebSearchTool = Tool.define(
  "websearch",
  Effect.gen(function* () {
    const http = yield* HttpClient.HttpClient
    const flags = yield* RuntimeFlags.Service
    const config = yield* Config.Service

    return {
      get description() {
        return DESCRIPTION.replace("{{year}}", new Date().getFullYear().toString())
      },
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const cfg = yield* config.get()
          const preference = (cfg.awakenedCapabilities?.webSearchProvider ?? "auto") as WebSearchProviderPreference
          const provider = selectWebSearchProvider(
            ctx.sessionID,
            {
              exa: flags.enableExa,
              parallel: flags.enableParallel,
            },
            preference,
          )
          const title = webSearchProviderLabel(provider)
          yield* ctx.metadata({ title: `${title} "${params.query}"`, metadata: { provider } })

          yield* ctx.ask({
            permission: "websearch",
            patterns: [params.query],
            always: ["*"],
            metadata: {
              query: params.query,
              numResults: params.numResults,
              livecrawl: params.livecrawl,
              type: params.type,
              contextMaxCharacters: params.contextMaxCharacters,
              provider,
            },
          })

          const search = (searchProvider: WebSearchProvider) => callProvider(http, searchProvider, params, ctx)
          const fallback = alternateWebSearchProvider(provider)

          const result = yield* Effect.raceFirst(
            search(provider).pipe(Effect.map((value) => ({ value, provider, fallback: false as const }))),
            search(fallback).pipe(Effect.map((value) => ({ value, provider: fallback, fallback: true as const }))),
          ).pipe(Effect.catch(() => Effect.succeed(undefined)))

          if (!result) {
            return {
              output:
                "Web search failed on both providers. Try a shorter query, switch provider in /awakened, or use webfetch on a known URL.",
              title: `Web Search failed: ${params.query}`,
              metadata: { provider: fallback, error: true },
            }
          }

          return {
            output: result.value,
            title: `${webSearchProviderLabel(result.provider)}: ${params.query}`,
            metadata: {
              provider: result.provider,
              error: false,
              ...(result.fallback ? { fallback: true, primaryProvider: provider } : {}),
            },
          }
        }).pipe(
          Effect.catch((error) =>
            Effect.succeed({
              output: `Web search failed: ${formatSearchError(error)}. Try a shorter query, switch provider in /awakened, or use webfetch on a known URL.`,
              title: `Web Search failed: ${params.query}`,
              metadata: { provider: "exa" as WebSearchProvider, error: true },
            }),
          ),
        ),
    }
  }),
)
