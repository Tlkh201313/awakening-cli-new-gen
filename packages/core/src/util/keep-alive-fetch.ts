import { Agent, fetch as undiciFetch } from "undici"
import { Layer } from "effect"
import { FetchHttpClient } from "effect/unstable/http"

const agent = new Agent({
  keepAliveTimeout: 30_000,
  keepAliveMaxTimeout: 60_000,
  connections: 128,
  pipelining: 1,
})

/** Shared fetch with HTTP keep-alive for lower API latency (avoids new TCP/TLS per request). */
export const keepAliveFetch = ((input: Parameters<typeof fetch>[0], init?: RequestInit) =>
  undiciFetch(input as Parameters<typeof undiciFetch>[0], {
    ...(init as Parameters<typeof undiciFetch>[1]),
    dispatcher: agent,
  })) as unknown as typeof fetch

export const KeepAliveFetchHttpClientLayer = FetchHttpClient.layer.pipe(
  Layer.provide(Layer.succeed(FetchHttpClient.Fetch, keepAliveFetch)),
)
