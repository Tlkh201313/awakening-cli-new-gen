import { describe, expect } from "bun:test"
import { Effect } from "effect"
import { Catalog } from "@awakened-ai/core/catalog"
import { ModelV2 } from "@awakened-ai/core/model"
import { PluginV2 } from "@awakened-ai/core/plugin"
import { GitlawbPlugin } from "@awakened-ai/core/plugin/provider/gitlawb"
import { ProviderPlugins } from "@awakened-ai/core/plugin/provider"
import { ProviderV2 } from "@awakened-ai/core/provider"
import { expectPluginRegistered, it, withEnv } from "./provider-helper"

const providerID = ProviderV2.ID.make("gitlawb-opengateway")
const cost = (input: number, output = 0) => [{ input, output, cache: { read: 0, write: 0 } }]

describe("GitlawbPlugin", () => {
  it.effect("is registered before dynamic provider plugins", () =>
    Effect.sync(() => {
      const ids = ProviderPlugins.map((item) => item.id)
      expectPluginRegistered(ids, "gitlawb-opengateway")
      expect(ids.indexOf(PluginV2.ID.make("gitlawb-opengateway"))).toBeLessThan(
        ids.indexOf(PluginV2.ID.make("dynamic-provider")),
      )
    }),
  )

  it.effect("injects provider and models when OPENGATEWAY_API_KEY is set", () =>
    withEnv({ OPENGATEWAY_API_KEY: "ogw_test", GITLAWB_OPENGATEWAY_API_KEY: undefined }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        yield* plugin.add(GitlawbPlugin)
        const load = yield* catalog.loader()
        yield* load(() => {})

        const provider = yield* catalog.provider.get(providerID)
        expect(provider.name).toBe("Gitlawb Opengateway")
        expect(provider.enabled).toEqual({ via: "env", name: "OPENGATEWAY_API_KEY" })
        expect(provider.endpoint).toEqual({
          type: "aisdk",
          package: "@ai-sdk/openai-compatible",
          url: "https://opengateway.gitlawb.com/v1",
        })
        expect(provider.env).toEqual(["OPENGATEWAY_API_KEY", "GITLAWB_OPENGATEWAY_API_KEY"])

        const pro = yield* catalog.model.get(providerID, ModelV2.ID.make("mimo-v2.5-pro"))
        expect(pro.name).toBe("MiMo V2.5 Pro")
        expect(pro.limit.context).toBe(1_000_000)
        expect(pro.limit.output).toBe(128_000)
        expect(pro.cost).toEqual(cost(0))
      }),
    ),
  )

  it.effect("sets free cost tiers for opengateway models", () =>
    withEnv({ GITLAWB_OPENGATEWAY_API_KEY: "ogw_alias" }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        yield* plugin.add(GitlawbPlugin)
        const load = yield* catalog.loader()
        yield* load((catalog) => {
          catalog.provider.update(providerID, (draft) => {
            draft.name = "Gitlawb Opengateway"
          })
          catalog.model.update(providerID, ModelV2.ID.make("mimo-v2-flash"), (draft) => {
            draft.cost = cost(1, 2)
          })
        })

        expect((yield* catalog.model.get(providerID, ModelV2.ID.make("mimo-v2-flash"))).cost).toEqual(cost(0))
      }),
    ),
  )
})
