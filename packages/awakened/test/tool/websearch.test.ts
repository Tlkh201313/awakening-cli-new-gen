import { describe, expect, test } from "bun:test"
import { Effect } from "effect"
import { parseResponse } from "../../src/tool/mcp-websearch"
import {
  alternateWebSearchProvider,
  expandSearchQueries,
  nextWebSearchProviderPreference,
  selectWebSearchProvider,
  webSearchModelName,
  webSearchProviderLabel,
  webSearchProviderPreferenceLabel,
} from "../../src/tool/websearch"
import { ProviderID } from "../../src/provider/schema"
import { webSearchEnabled } from "../../src/tool/registry"
import { it } from "../lib/effect"

const SESSION_ID = "ses_0196aabbccddeeff001122334455"

describe("websearch provider", () => {
  test("selects a stable provider per session", () => {
    expect(selectWebSearchProvider(SESSION_ID)).toBe(selectWebSearchProvider(SESSION_ID))
  })

  test("supports an operational override", () => {
    const original = process.env.AWAKENED_WEBSEARCH_PROVIDER

    try {
      process.env.AWAKENED_WEBSEARCH_PROVIDER = "parallel"
      expect(selectWebSearchProvider(SESSION_ID)).toBe("parallel")

      process.env.AWAKENED_WEBSEARCH_PROVIDER = "exa"
      expect(selectWebSearchProvider(SESSION_ID)).toBe("exa")
    } finally {
      if (original === undefined) delete process.env.AWAKENED_WEBSEARCH_PROVIDER
      else process.env.AWAKENED_WEBSEARCH_PROVIDER = original
    }
  })

  test("routes to Exa when the Exa flag is enabled", () => {
    expect(selectWebSearchProvider(SESSION_ID, { exa: true, parallel: false })).toBe("exa")
  })

  test("routes to Parallel when the Parallel flag is enabled", () => {
    expect(selectWebSearchProvider(SESSION_ID, { exa: false, parallel: true })).toBe("parallel")
  })

  test("respects configured provider preference", () => {
    expect(selectWebSearchProvider(SESSION_ID, { exa: false, parallel: false }, "parallel")).toBe("parallel")
    expect(selectWebSearchProvider(SESSION_ID, { exa: false, parallel: false }, "exa")).toBe("exa")
  })

  test("is only enabled for awakened or explicit websearch provider flags", () => {
    expect(webSearchEnabled(ProviderID.awakened, { exa: false, parallel: false })).toBe(true)
    expect(webSearchEnabled(ProviderID.openai, { exa: false, parallel: false })).toBe(false)
    expect(webSearchEnabled(ProviderID.openai, { exa: true, parallel: false })).toBe(true)
    expect(webSearchEnabled(ProviderID.openai, { exa: false, parallel: true })).toBe(true)
    expect(webSearchEnabled(ProviderID.openai, { exa: false, parallel: false }, "exa")).toBe(true)
    expect(webSearchEnabled(ProviderID.openai, { exa: false, parallel: false }, "parallel")).toBe(true)
  })

  test("uses branded labels", () => {
    expect(webSearchProviderLabel("parallel")).toBe("Parallel Web Search")
    expect(webSearchProviderLabel("exa")).toBe("Exa Web Search")
    expect(webSearchProviderLabel(undefined)).toBe("Web Search")
    expect(webSearchProviderPreferenceLabel("auto")).toBe("Auto")
  })

  test("cycles provider preference", () => {
    expect(nextWebSearchProviderPreference("auto")).toBe("exa")
    expect(nextWebSearchProviderPreference("exa")).toBe("parallel")
    expect(nextWebSearchProviderPreference("parallel")).toBe("auto")
  })

  test("returns the alternate provider", () => {
    expect(alternateWebSearchProvider("exa")).toBe("parallel")
    expect(alternateWebSearchProvider("parallel")).toBe("exa")
  })

  test("uses the provider API model id for Parallel analytics", () => {
    expect(
      webSearchModelName({
        model: {
          id: "claude-opus-4-7",
          api: { id: "claude-opus-4.7" },
        },
      }),
    ).toBe("claude-opus-4.7")
  })
})

describe("websearch query expansion", () => {
  test("adds the current year for recency queries", () => {
    expect(expandSearchQueries("latest AI news", 2026)).toEqual(["latest AI news", "latest AI news 2026"])
  })

  test("splits compound queries", () => {
    expect(expandSearchQueries("React hooks and server components", 2026)).toEqual([
      "React hooks and server components",
      "React hooks",
      "server components",
    ])
  })

  test("includes quoted phrases", () => {
    expect(expandSearchQueries('find docs for "Effect TS"', 2026)).toEqual(['find docs for "Effect TS"', "Effect TS"])
  })
})

describe("websearch MCP response parser", () => {
  const payload = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    result: {
      content: [
        {
          type: "text",
          text: "search results",
        },
      ],
    },
  })

  it.effect("parses plain JSON-RPC responses", () =>
    Effect.gen(function* () {
      const result = yield* parseResponse(payload)
      expect(result).toBe("search results")
    }),
  )

  it.effect("parses SSE JSON-RPC responses", () =>
    Effect.gen(function* () {
      const result = yield* parseResponse(`event: message\ndata: ${payload}\n\n`)
      expect(result).toBe("search results")
    }),
  )

  it.effect("ignores non-JSON SSE data frames", () =>
    Effect.gen(function* () {
      const result = yield* parseResponse(`data: [DONE]\ndata: ${payload}\n\n`)
      expect(result).toBe("search results")
    }),
  )

  it.effect("joins multiple text blocks", () =>
    Effect.gen(function* () {
      const multi = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        result: {
          content: [
            { type: "text", text: "first block" },
            { type: "text", text: "second block" },
          ],
        },
      })
      const result = yield* parseResponse(multi)
      expect(result).toBe("first block\n\nsecond block")
    }),
  )
})
