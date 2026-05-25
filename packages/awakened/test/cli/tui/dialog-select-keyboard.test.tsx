/** @jsxImportSource @opentui/solid */
import { createDefaultOpenTuiKeymap } from "@opentui/keymap/opentui"
import { testRender, useRenderer } from "@opentui/solid"
import { expect, test } from "bun:test"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { onCleanup, onMount } from "solid-js"
import { tmpdir } from "../../fixture/fixture"
import { createTuiResolvedConfig } from "../../fixture/tui-runtime"

async function mountSelect(input: {
  root: string
  onSelect: (value: string) => void
}) {
  const { Global } = await import("@awakened-ai/core/global")
  const previous = {
    config: Global.Path.config,
    state: Global.Path.state,
  }
  Global.Path.config = path.join(input.root, "config")
  Global.Path.state = path.join(input.root, "state")
  await mkdir(Global.Path.config, { recursive: true })
  await mkdir(Global.Path.state, { recursive: true })
  await Bun.write(path.join(Global.Path.state, "kv.json"), "{}")

  const [
    { DialogProvider, useDialog },
    { DialogSelect },
    { KVProvider },
    { ThemeProvider },
    { TuiConfigProvider },
    { ToastProvider },
    { AwakenedKeymapProvider, registerAwakenedKeymap },
  ] = await Promise.all([
    import("../../../src/cli/cmd/tui/ui/dialog"),
    import("../../../src/cli/cmd/tui/ui/dialog-select"),
    import("../../../src/cli/cmd/tui/context/kv"),
    import("../../../src/cli/cmd/tui/context/theme"),
    import("../../../src/cli/cmd/tui/context/tui-config"),
    import("../../../src/cli/cmd/tui/ui/toast"),
    import("../../../src/cli/cmd/tui/keymap"),
  ])

  function Harness() {
    const dialog = useDialog()

    onMount(() => {
      dialog.replace(() => (
        <DialogSelect
          title="Connect a provider"
          options={[
            { title: "Alpha", value: "alpha" },
            { title: "Beta", value: "beta" },
          ]}
          onSelect={(option) => input.onSelect(option.value)}
        />
      ))
    })

    return null
  }

  function Root() {
    const renderer = useRenderer()
    const keymap = createDefaultOpenTuiKeymap(renderer)
    const resolvedConfig = createTuiResolvedConfig({
      leader_timeout: 1000,
    })
    const off = registerAwakenedKeymap(keymap, renderer, resolvedConfig)
    onCleanup(off)

    return (
      <AwakenedKeymapProvider keymap={keymap}>
        <TuiConfigProvider config={resolvedConfig}>
          <KVProvider>
            <ThemeProvider mode="dark">
              <ToastProvider>
                <DialogProvider>
                  <Harness />
                </DialogProvider>
              </ToastProvider>
            </ThemeProvider>
          </KVProvider>
        </TuiConfigProvider>
      </AwakenedKeymapProvider>
    )
  }

  const app = await testRender(() => <Root />, { kittyKeyboard: true })
  return {
    app,
    async cleanup() {
      app.renderer.destroy()
      Global.Path.config = previous.config
      Global.Path.state = previous.state
    },
  }
}

test("dialog select navigation works when filter input is not auto-focused", async () => {
  await using tmp = await tmpdir()
  const selected: string[] = []
  const dialog = await mountSelect({
    root: tmp.path,
    onSelect: (value) => selected.push(value),
  })

  try {
    await Bun.sleep(50)
    dialog.app.mockInput.pressKey("n", { ctrl: true })
    dialog.app.mockInput.pressEnter()

    expect(selected).toEqual(["beta"])
  } finally {
    await dialog.cleanup()
  }
})
