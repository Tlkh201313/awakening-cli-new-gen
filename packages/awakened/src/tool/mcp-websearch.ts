import { Effect, Option, Schema, type Duration } from "effect"
import { HttpClient, HttpClientRequest } from "effect/unstable/http"
import { InstallationVersion } from "@awakened-ai/core/installation/version"

export const EXA_URL = process.env.EXA_API_KEY
  ? `https://mcp.exa.ai/mcp?exaApiKey=${encodeURIComponent(process.env.EXA_API_KEY)}`
  : "https://mcp.exa.ai/mcp"
export const PARALLEL_URL = "https://search.parallel.ai/mcp"

const McpResult = Schema.Struct({
  result: Schema.Struct({
    content: Schema.Array(
      Schema.Struct({
        type: Schema.String,
        text: Schema.String,
      }),
    ),
  }),
})

const McpError = Schema.Struct({
  error: Schema.Struct({
    message: Schema.optional(Schema.String),
    code: Schema.optional(Schema.Number),
  }),
})

const decodeResult = Schema.decodeUnknownEffect(Schema.fromJsonString(McpResult))
const decodeError = Schema.decodeUnknownEffect(Schema.fromJsonString(McpError))

const parsePayload = (payload: string) =>
  Effect.gen(function* () {
    const trimmed = payload.trim()
    if (!trimmed.startsWith("{")) return undefined

    const error = yield* decodeError(trimmed).pipe(Effect.option)
    if (error._tag === "Some") {
      const message = error.value.error.message ?? "MCP search request failed"
      return yield* Effect.fail(new Error(message))
    }

    const data = yield* decodeResult(trimmed).pipe(Effect.option)
    if (data._tag === "None") return undefined
    const texts = data.value.result.content
      .filter((item) => item.type === "text" && item.text.trim())
      .map((item) => item.text.trim())
    if (!texts.length) return undefined
    return texts.join("\n\n")
  })

export const parseResponse = Effect.fn("McpWebSearch.parseResponse")(function* (body: string) {
  const trimmed = body.trim()
  const direct = trimmed ? yield* parsePayload(trimmed).pipe(Effect.option) : Option.none<string>()
  if (Option.isSome(direct) && direct.value) return direct.value

  for (const line of body.split("\n")) {
    if (!line.startsWith("data: ")) continue
    const data = yield* parsePayload(line.substring(6)).pipe(Effect.option)
    if (Option.isSome(data) && data.value) return data.value
  }
  return undefined
})

export const SearchArgs = Schema.Struct({
  query: Schema.String,
  type: Schema.String,
  numResults: Schema.Number,
  livecrawl: Schema.String,
  contextMaxCharacters: Schema.optional(Schema.Number),
})

export const ParallelSearchArgs = Schema.Struct({
  objective: Schema.String,
  search_queries: Schema.Array(Schema.String),
  session_id: Schema.optional(Schema.String),
  model_name: Schema.optional(Schema.String),
})

const McpRequest = <F extends Schema.Struct.Fields>(args: Schema.Struct<F>) =>
  Schema.Struct({
    jsonrpc: Schema.Literal("2.0"),
    id: Schema.Literal(1),
    method: Schema.Literal("tools/call"),
    params: Schema.Struct({
      name: Schema.String,
      arguments: args,
    }),
  })

const defaultHeaders = () => ({
  "User-Agent": `awakened/${InstallationVersion}`,
  Connection: "keep-alive",
})

export const call = <F extends Schema.Struct.Fields>(
  http: HttpClient.HttpClient,
  url: string,
  tool: string,
  args: Schema.Struct<F>,
  value: Schema.Struct.Type<F>,
  timeout: Duration.Input,
  headers?: Record<string, string>,
) =>
  Effect.gen(function* () {
    const request = yield* HttpClientRequest.post(url).pipe(
      HttpClientRequest.accept("application/json, text/event-stream"),
      HttpClientRequest.setHeaders({ ...defaultHeaders(), ...headers }),
      HttpClientRequest.schemaBodyJson(McpRequest(args))({
        jsonrpc: "2.0" as const,
        id: 1 as const,
        method: "tools/call" as const,
        params: { name: tool, arguments: value },
      }),
    )
    const response = yield* HttpClient.filterStatusOk(http)
      .execute(request)
      .pipe(
        Effect.timeoutOrElse({
          duration: timeout,
          orElse: () => Effect.fail(new Error(`${tool} timed out`)),
        }),
        Effect.catch((error) => Effect.fail(new Error(formatCallError(tool, error)))),
      )
    const body = yield* response.text
    const parsed = yield* parseResponse(body)
    if (parsed) return parsed
    return yield* Effect.fail(new Error(`${tool} returned no readable search results`))
  })

function formatCallError(tool: string, error: unknown) {
  if (error instanceof Error) return `${tool} failed: ${error.message}`
  return `${tool} failed`
}
