/** @jsxImportSource @opentui/solid */
import { expect, test } from "bun:test"
import { createDefaultOpenTuiKeymap } from "@opentui/keymap/opentui"
import { testRender, useRenderer } from "@opentui/solid"
import type { TuiPluginApi, TuiPluginMeta, TuiRouteCurrent } from "@awakened-ai/plugin/tui"
import { KVProvider } from "../../../src/cli/cmd/tui/context/kv"
import { ThemeProvider } from "../../../src/cli/cmd/tui/context/theme"
import { TuiConfigProvider } from "../../../src/cli/cmd/tui/context/tui-config"
import { AwakenedKeymapProvider } from "../../../src/cli/cmd/tui/keymap"
import usagePlugin from "../../../src/cli/cmd/tui/feature-plugins/system/usage"
import { createTuiPluginApi } from "../../fixture/tui-plugin"
import { createTuiResolvedConfig } from "../../fixture/tui-runtime"

const pluginMeta = {
  id: "internal:usage",
  source: "internal",
  spec: "internal:usage",
  target: "internal:usage",
  first_time: 0,
  last_time: 0,
  time_changed: 0,
  load_count: 1,
  fingerprint: "usage",
  state: "first",
} satisfies TuiPluginMeta

test("usage plugin registers /usage slash command", async () => {
  const commands = new Map<
    string,
    NonNullable<Parameters<TuiPluginApi["keymap"]["registerLayer"]>[0]["commands"]>[number]
  >()
  let current: TuiRouteCurrent = { name: "session", params: { sessionID: "session-1" } }

  function Harness() {
    const renderer = useRenderer()
    const keymap = createDefaultOpenTuiKeymap(renderer)
    const registerLayer = keymap.registerLayer.bind(keymap)
    keymap.registerLayer = (layer) => {
      layer.commands?.forEach((command) => commands.set(command.name, command))
      return registerLayer(layer)
    }
    const api = {
      ...createTuiPluginApi({
        keymap,
        state: {
          session: {
            get: ((sessionID: string) =>
              sessionID === "session-1"
                ? {
                    id: "session-1",
                    title: "Test",
                    cost: 0.0123,
                    tokens: {
                      input: 1000,
                      output: 500,
                      reasoning: 100,
                      cache: { read: 200, write: 50 },
                    },
                  }
                : undefined) as TuiPluginApi["state"]["session"]["get"],
            messages: ((() => [
              {
                role: "assistant",
                tokens: {
                  input: 800,
                  output: 400,
                  reasoning: 0,
                  cache: { read: 100, write: 0 },
                },
                providerID: "test",
                modelID: "model",
                agent: "build",
              },
            ]) as unknown) as TuiPluginApi["state"]["session"]["messages"],
          },
        },
      }),
      route: {
        register() {
          return () => {}
        },
        navigate() {},
        get current() {
          return current
        },
      },
    } satisfies TuiPluginApi

    void usagePlugin.tui(api, undefined, pluginMeta)

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

  const command = commands.get("session.usage")
  expect(command?.slashName).toBe("usage")
  expect(command?.slashAliases).toContain("cost")
  expect(typeof command?.run).toBe("function")

  current = { name: "home" }
  command?.run?.({} as never)
})
