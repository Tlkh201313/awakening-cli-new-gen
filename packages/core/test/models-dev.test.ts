import { describe, expect } from "bun:test"
import { Effect } from "effect"
import { ModelsDev } from "@awakened-ai/core/models-dev"
import { ModelsDevProvider } from "@awakened-ai/core/plugin/provider/gitlawb"
import { testEffect } from "./lib/effect"

const it = testEffect(ModelsDev.defaultLayer)

describe("ModelsDev supplemental providers", () => {
  it.effect("includes gitlawb-opengateway", () =>
    Effect.gen(function* () {
      const data = yield* ModelsDev.Service.use((service) => service.get())
      expect(data["gitlawb-opengateway"]).toEqual(ModelsDevProvider)
    }),
  )
})
