/** @jsxImportSource @opentui/solid */
import { expect, test } from "bun:test"
import { createDefaultOpenTuiKeymap } from "@opentui/keymap/opentui"
import { testRender, useRenderer } from "@opentui/solid"
import type { TuiPluginApi, TuiPluginMeta } from "@awakened-ai/plugin/tui"
import { KVProvider } from "../../../src/cli/cmd/tui/context/kv"
import { ThemeProvider } from "../../../src/cli/cmd/tui/context/theme"
import { TuiConfigProvider } from "../../../src/cli/cmd/tui/context/tui-config"
import { AwakenedKeymapProvider } from "../../../src/cli/cmd/tui/keymap"
import voicePlugin from "../../../src/cli/cmd/tui/feature-plugins/system/voice"
import { bindVoiceApi, dispatchVoiceSlash, unbindVoiceApi, voiceSnapshot } from "../../../src/cli/cmd/tui/util/voice/controller"
import { createTuiPluginApi } from "../../fixture/tui-plugin"
import { createTuiResolvedConfig } from "../../fixture/tui-runtime"

const pluginMeta = {
  id: "internal:voice",
  source: "internal",
  spec: "internal:voice",
  target: "internal:voice",
  first_time: 0,
  last_time: 0,
  time_changed: 0,
  load_count: 1,
  fingerprint: "voice",
  state: "first",
} satisfies TuiPluginMeta

test("voice plugin registers /voice slash command", async () => {
  const commands = new Map<
    string,
    NonNullable<Parameters<TuiPluginApi["keymap"]["registerLayer"]>[0]["commands"]>[number]
  >()

  function Harness() {
    const renderer = useRenderer()
    const keymap = createDefaultOpenTuiKeymap(renderer)
    const registerLayer = keymap.registerLayer.bind(keymap)
    keymap.registerLayer = (layer) => {
      layer.commands?.forEach((command) => commands.set(command.name, command))
      return registerLayer(layer)
    }
    const api = createTuiPluginApi({ keymap })
    bindVoiceApi(api)
    void voicePlugin.tui(api, undefined, pluginMeta)

    return (
      <AwakenedKeymapProvider keymap={keymap}>
        <TuiConfigProvider config={createTuiResolvedConfig()}>
          <KVProvider>
            <ThemeProvider mode="dark">
              <box />
            </ThemeProvider>
          </KVProvider>
        </TuiConfigProvider>
      </AwakenedKeymapProvider>
    )
  }

  await testRender(() => <Harness />, { width: 80, height: 20 })

  expect(commands.get("voice.toggle")).toBeDefined()
  expect(commands.get("voice.settings")).toBeDefined()
})

test("dispatchVoiceSlash handles /voice when api is bound", () => {
  const api = createTuiPluginApi()
  bindVoiceApi(api)
  expect(dispatchVoiceSlash("voice")).toBe(true)
  expect(dispatchVoiceSlash("dictate")).toBe(true)
  unbindVoiceApi()
})

test("dispatchVoiceSlash requires bound api", () => {
  unbindVoiceApi()
  expect(dispatchVoiceSlash("voice")).toBe(false)
  expect(voiceSnapshot().status).toBe("idle")
})
